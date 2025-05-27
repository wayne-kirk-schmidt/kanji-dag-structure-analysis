import { renderCanvas } from "./renderCanvas.js";
import { computeGraphDiff } from "./diffDataStructures.js";

window.App = {
  data: {},
  graphs: {},
  diff: null, // holds diff result once computed

  // Render the graph in the specified panel and record original node colors.
  renderGraph: function (panelId, data, darkModeOverride) {
    const darkMode =
      darkModeOverride !== undefined
        ? darkModeOverride
        : document.body.classList.contains("dark-mode");
    this.data[panelId] = data;
    this.graphs[panelId] = renderCanvas(panelId, data, { darkMode });

    // Set __originalColor for nodes that don't have one.
    if (data.nodes && Array.isArray(data.nodes)) {
      data.nodes.forEach((node) => {
        if (node.__originalColor === undefined) {
          node.__originalColor = node.__computedColor || "#ccc";
        }
      });
    }
  },
};

// Helper to force re-render of a panel.
function forcePanelRender(panelId) {
  if (App.data[panelId]) {
    App.renderGraph(panelId, App.data[panelId]);
    const graph = App.graphs[panelId];
    if (graph) {
      if (typeof graph.refresh === "function") {
        graph.refresh();
      } else {
        graph.graphData(App.data[panelId]);
      }
    }
  }
}

// Helper to download a JSON file.
function downloadJSONLog(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility function to pad numbers.
function pad(n) {
  return n.toString().padStart(2, "0");
}

// Dark/Light Mode Toggle.
document.getElementById("darkToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  for (let panelId in App.data) {
    App.renderGraph(panelId, App.data[panelId]);
  }
  updateComparisonColors();
});

// Download Diagnostic Information.
document.getElementById("downloadDebugLogs").addEventListener("click", () => {
  if (App.data["datapanel1"]) {
    downloadJSONLog("dataset1.json", App.data["datapanel1"]);
  }
  if (App.data["datapanel2"]) {
    downloadJSONLog("dataset2.json", App.data["datapanel2"]);
  }
  const diag = buildDiffDiagnostics();
  downloadJSONLog("diffDiagnostics.json", diag);
});

function buildDiffDiagnostics() {
  const diag = {};
  diag.diff = App.diff || {};
  if (App.data["datapanel1"] && App.data["datapanel1"].nodes) {
    diag.dataset1OriginalColors = App.data["datapanel1"].nodes.map((node) => ({
      id: node.id,
      originalColor: node.__originalColor,
    }));
  }
  if (App.data["datapanel2"] && App.data["datapanel2"].nodes) {
    diag.dataset2OriginalColors = App.data["datapanel2"].nodes.map((node) => ({
      id: node.id,
      originalColor: node.__originalColor,
    }));
  }
  return diag;
}

// File loading for Dataset1.
document.getElementById("fileInput1").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      App.renderGraph("datapanel1", data);
      updateCategoryFilters("datapanel1", data, "categoryFilters1");
      updateComparisonColors();
    } catch (err) {
      alert("Error loading Dataset1: " + err.message);
    }
  };
  reader.readAsText(file);
});

// File loading for Dataset2.
document.getElementById("fileInput2").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      App.renderGraph("datapanel2", data);
      updateCategoryFilters("datapanel2", data, "categoryFilters2");
      updateComparisonColors();
    } catch (err) {
      alert("Error loading Dataset2: " + err.message);
    }
  };
  reader.readAsText(file);
});

// Layout change listeners.
document.getElementById("layoutSelect1").addEventListener("change", () => {
  if (App.data["datapanel1"]) {
    App.renderGraph("datapanel1", App.data["datapanel1"]);
    updateComparisonColors();
  }
});
document.getElementById("layoutSelect2").addEventListener("change", () => {
  if (App.data["datapanel2"]) {
    App.renderGraph("datapanel2", App.data["datapanel2"]);
    updateComparisonColors();
  }
});

// Save as PNG for Dataset1.
document.getElementById("savePng1").addEventListener("click", () => {
  const isDarkMode = document.body.classList.contains("dark-mode");
  const graph = App.graphs["datapanel1"];
  graph.backgroundColor(isDarkMode ? "#000000" : "#ffffff");
  graph.graphData(App.data["datapanel1"]);

  setTimeout(() => {
    const panel = document.getElementById("datapanel1");
    const sourceCanvas = panel.querySelector("canvas");
    if (!sourceCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const ctx = exportCanvas.getContext("2d");

    ctx.fillStyle = isDarkMode ? "#000000" : "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const mode = isDarkMode ? "DarkMode" : "LightMode";
    const layout = document.getElementById("layoutSelect1").value;
    const filename = `datapanel1_${mode}_${layout}_${timestamp}.png`;

    exportCanvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, "image/png");
  }, 750);
});

// Save as PNG for Dataset2.
document.getElementById("savePng2").addEventListener("click", () => {
  const isDarkMode = document.body.classList.contains("dark-mode");
  const graph = App.graphs["datapanel2"];
  graph.backgroundColor(isDarkMode ? "#000000" : "#ffffff");
  graph.graphData(App.data["datapanel2"]);

  setTimeout(() => {
    const panel = document.getElementById("datapanel2");
    const sourceCanvas = panel.querySelector("canvas");
    if (!sourceCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const ctx = exportCanvas.getContext("2d");

    ctx.fillStyle = isDarkMode ? "#000000" : "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const mode = isDarkMode ? "DarkMode" : "LightMode";
    const layout = document.getElementById("layoutSelect2").value;
    const filename = `datapanel2_${mode}_${layout}_${timestamp}.png`;

    exportCanvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, "image/png");
  }, 750);
});

// Search by Name for Dataset1.
document.getElementById("searchNode1").addEventListener("input", (e) => {
  const input = e.target.value.trim().toLowerCase();
  const data = App.data["datapanel1"];
  const graph = App.graphs["datapanel1"];
  if (!data || !graph || input === "") return;
  const node = data.nodes.find((n) => n.id.toLowerCase().includes(input));
  if (node) {
    graph.centerAt(node.x, node.y, 1000);
    graph.zoom(4, 1000);
  }
});

// Search by Name for Dataset2.
document.getElementById("searchNode2").addEventListener("input", (e) => {
  const input = e.target.value.trim().toLowerCase();
  const data = App.data["datapanel2"];
  const graph = App.graphs["datapanel2"];
  if (!data || !graph || input === "") return;
  const node = data.nodes.find((n) => n.id.toLowerCase().includes(input));
  if (node) {
    graph.centerAt(node.x, node.y, 1000);
    graph.zoom(4, 1000);
  }
});

// Update Category Filters.
function updateCategoryFilters(panelId, data, filterContainerId) {
  const container = document.getElementById(filterContainerId);
  container.innerHTML = "";
  const categories = [...new Set(data.nodes.map((n) => n.group || n.category || "uncategorized"))];
  categories.forEach((cat) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.value = cat;
    checkbox.id = `${panelId}-${cat.replace(/\W/g, "_")}`;
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = cat;
    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(document.createElement("br"));
    checkbox.addEventListener("change", () => {
      applyCategoryFilter(panelId, data, filterContainerId);
    });
  });
  applyCategoryFilter(panelId, data, filterContainerId);
}

function applyCategoryFilter(panelId, data, filterContainerId) {
  const container = document.getElementById(filterContainerId);
  const checkboxes = container.querySelectorAll("input[type='checkbox']");
  const allowed = [];
  checkboxes.forEach((cb) => {
    if (cb.checked) allowed.push(cb.value);
  });
  const graph = App.graphs[panelId];
  if (!graph) return;
  graph.nodeVisibility((node) => {
    const cat = node.group || node.category || "uncategorized";
    return allowed.includes(cat);
  });
}

// Compare Functionality.
function updateComparisonColors() {
  if (!App.data["datapanel1"] || !App.data["datapanel2"]) return;
  const diff = computeGraphDiff(App.data["datapanel1"], App.data["datapanel2"]);
  App.diff = diff;
  
  const twinExclusive = diff.added;    // Nodes in dataset2 not in dataset1.
  const baseExclusive = diff.deleted;  // Nodes in dataset1 not in dataset2.
  const commonNodes = diff.same;       // Common nodes.
  
  const compareBaseChecked = document.getElementById("compareBase")?.checked;
  const compareTwinChecked = document.getElementById("compareTwin")?.checked;
  const compareCommonChecked = document.getElementById("compareCommon")?.checked;
  
  // Update Dataset1 node colors.
  const graph1 = App.graphs["datapanel1"];
  const data1 = App.data["datapanel1"];
  if (graph1 && data1 && data1.nodes) {
    data1.nodes.forEach((node) => {
      let newColor = node.__originalColor || "#ccc";
      if (compareCommonChecked && commonNodes.includes(node.id)) {
        newColor = "blue";
      } else if (compareBaseChecked && baseExclusive.includes(node.id)) {
        newColor = "red";
      }
      node.__overrideColor = newColor;
    });
    if (typeof graph1.refresh === "function") {
      graph1.refresh();
    } else {
      graph1.graphData(App.data["datapanel1"]);
    }
  }
  
  // Update Dataset2 node colors.
  const graph2 = App.graphs["datapanel2"];
  const data2 = App.data["datapanel2"];
  if (graph2 && data2 && data2.nodes) {
    data2.nodes.forEach((node) => {
      let newColor = node.__originalColor || "#ccc";
      if (compareCommonChecked && commonNodes.includes(node.id)) {
        newColor = "blue";
      } else if (compareTwinChecked && twinExclusive.includes(node.id)) {
        newColor = "green";
      }
      node.__overrideColor = newColor;
    });
    if (typeof graph2.refresh === "function") {
      graph2.refresh();
    } else {
      graph2.graphData(App.data["datapanel2"]);
    }
  }
}

document.getElementById("compareBase")?.addEventListener("change", updateComparisonColors);
document.getElementById("compareTwin")?.addEventListener("change", updateComparisonColors);
document.getElementById("compareCommon")?.addEventListener("change", updateComparisonColors);