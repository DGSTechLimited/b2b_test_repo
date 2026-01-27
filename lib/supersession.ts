export type SupersessionEdge = {
  oldPartNo: string;
  newPartNo: string;
};

function hasPath(adjacency: Map<string, Set<string>>, start: string, target: string): boolean {
  if (start === target) {
    return true;
  }
  const visited = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    const neighbors = adjacency.get(current);
    if (!neighbors) {
      continue;
    }
    for (const next of neighbors) {
      if (next === target) {
        return true;
      }
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }
  return false;
}

export function detectSupersessionCycles(
  existingEdges: SupersessionEdge[],
  incomingEdges: SupersessionEdge[]
) {
  const adjacency = new Map<string, Set<string>>();

  const addEdge = (edge: SupersessionEdge) => {
    const list = adjacency.get(edge.oldPartNo) ?? new Set<string>();
    list.add(edge.newPartNo);
    adjacency.set(edge.oldPartNo, list);
  };

  for (const edge of existingEdges) {
    addEdge(edge);
  }

  const rejectedIndexes = new Set<number>();

  incomingEdges.forEach((edge, index) => {
    if (hasPath(adjacency, edge.newPartNo, edge.oldPartNo)) {
      rejectedIndexes.add(index);
      return;
    }
    addEdge(edge);
  });

  return rejectedIndexes;
}
