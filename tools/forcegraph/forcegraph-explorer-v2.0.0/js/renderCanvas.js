import ForceGraph from "https://cdn.skypack.dev/force-graph";

export function renderCanvas(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  let graph = container._fg;
  if (!graph) {
    graph = ForceGraph()(container);
    container._fg = graph;
  }

  // Determine dark mode setting.
  const darkMode =
    options.darkMode !== undefined
      ? options.darkMode
      : document.body.classList.contains("dark-mode");

  // Set the background color explicitly.
  const bgColor = darkMode ? "#000000" : "#ffffff";
  graph.backgroundColor(bgColor);
  console.log("renderCanvas: Set backgroundColor to", bgColor, "for darkMode =", darkMode);

  // Force a re-render by re-applying the graph data.
  graph.graphData(data);
  console.log("renderCanvas: Finished applying graph data.");

  // Define default text and link colors.
  const defaultTextColor = darkMode ? "#ffffff" : "#000000";
  const defaultLinkColor = darkMode ? "#ffffff" : "#333333";

  // Define a palette for category coloring.
  const categoryColors = [
    "#e6194b", "#f58231", "#ffe119", "#bfef45", "#3cb44b",
    "#42d4f4", "#4363d8", "#911eb4", "#f032e6", "#a9a9a9",
    "#fabebe", "#ffd8b1", "#fffac8", "#d9ead3", "#a2c4c9",
    "#b4a7d6", "#c27ba0", "#e6beff", "#76a5af", "#aaffc3",
    "#dcbeff", "#ffb3ba", "#ffdfba", "#ffffba", "#baffc9",
    "#bae1ff", "#ffcccb", "#e0bbff", "#bbdefb", "#c8e6c9"
  ];
  const categoryColorMap = {};
  let colorIndex = 0;
  const fallbackCategory = "uncategorized";

  graph
    .linkColor(() => defaultLinkColor)
    .nodeLabel((node) => node.id || "")
    .nodeCanvasObject((node, ctx, globalScale) => {
      // Use override color if available; otherwise, compute from category.
      const useColor =
        node.__overrideColor !== undefined
          ? node.__overrideColor
          : getCategoryColor(node);
      const size = 5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = useColor;
      ctx.fill();

      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = defaultTextColor;
      ctx.fillText(node.id, node.x, node.y + 12);
    })
    .graphData(data);

  console.log("renderCanvas: Completed drawing.");

  // Determine layout.
  const layoutSelectId = containerId.replace("datapanel", "layoutSelect");
  const layoutSelect = document.getElementById(layoutSelectId);
  const layout = layoutSelect ? layoutSelect.value : "force";

  if (layout !== "force") {
    applyCustomLayout(data, layout);
    graph.d3Force("charge", null);
    graph.d3Force("link", null);
    graph.cooldownTicks(0).cooldownTime(0);
    graph.nodeRelSize(4);
  } else {
    graph.d3Force("charge", d3.forceManyBody());
    graph.d3Force("link", d3.forceLink().id((d) => d.id));
    graph.cooldownTicks(150);
    graph.cooldownTime(3000);
  }
  return graph;

  function getCategoryColor(n) {
    const category = n.group || n.category || n.type || fallbackCategory;
    if (!categoryColorMap[category]) {
      categoryColorMap[category] = categoryColors[colorIndex % categoryColors.length];
      colorIndex++;
    }
    return categoryColorMap[category];
  }
}

function applyCustomLayout(data, layout) {
  const nodes = data.nodes;
  const total = nodes.length;
  const width = 800, height = 600;
  
  if (layout === "radial") {
    nodes.forEach((node, i) => {
      const angle = (i / total) * 2 * Math.PI;
      node.x = width / 2 + 200 * Math.cos(angle);
      node.y = height / 2 + 200 * Math.sin(angle);
    });
  }
  
  if (layout === "galaxy") {
    const groupMap = {};
    let gIndex = 0;
    nodes.forEach((node) => {
      const g = node.group || "uncategorized";
      if (!(g in groupMap)) {
        groupMap[g] = gIndex++;
      }
      const angle = Math.random() * 2 * Math.PI;
      const radius = 100 + Math.random() * 50;
      node.x = width / 2 + (groupMap[g] * 200) + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
    });
  }
}