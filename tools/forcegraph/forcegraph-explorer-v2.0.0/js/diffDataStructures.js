// diffDataStructures.js
export function computeGraphDiff(dataset1, dataset2) {
  const nodes1 = new Set(dataset1.nodes.map(n => n.id));
  const nodes2 = new Set(dataset2.nodes.map(n => n.id));

  const same = [...nodes1].filter(id => nodes2.has(id));
  const deleted = [...nodes1].filter(id => !nodes2.has(id));
  const added = [...nodes2].filter(id => !nodes1.has(id));

  return {
    same,
    deleted,
    added
  };
}
