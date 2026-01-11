/**
 * Pathfinding Service
 * Implements bidirectional BFS to find shortest paths between Wikipedia articles
 */

import sdowService from "./sdowService.js";

export async function findPath(sourceTitle, targetTitle, maxDepth = 6) {
  const startTime = Date.now();

  const sourcePage = sdowService.findPageByTitle(sourceTitle);
  const targetPage = sdowService.findPageByTitle(targetTitle);

  if (!sourcePage) {
    throw new Error(`Source article "${sourceTitle}" not found`);
  }

  if (!targetPage) {
    throw new Error(`Target article "${targetTitle}" not found`);
  }

  let sourceId = sourcePage.id;
  let targetId = targetPage.id;

  if (sourcePage.is_redirect) {
    const resolved = sdowService.resolveRedirect(sourcePage.id);
    if (resolved) sourceId = resolved.target_id;
  }

  if (targetPage.is_redirect) {
    const resolved = sdowService.resolveRedirect(targetPage.id);
    if (resolved) targetId = resolved.target_id;
  }

  if (sourceId === targetId) {
    const pages = { [sourceId]: sourcePage };
    return {
      path: [sourceId],
      degrees: 0,
      pages,
      duration_ms: Date.now() - startTime,
    };
  }

  const result = bidirectionalBFS(sourceId, targetId, maxDepth);

  if (!result) {
    return {
      path: null,
      degrees: -1,
      pages: {},
      duration_ms: Date.now() - startTime,
      error: `No path found within ${maxDepth} degrees`,
    };
  }

  const pages = {};
  const pageData = sdowService.findPagesByIds(result.path);

  pageData.forEach((page) => {
    pages[page.id] = {
      id: page.id,
      title: page.title,
      is_redirect: page.is_redirect,
    };
  });

  return {
    path: result.path,
    degrees: result.path.length - 1,
    pages,
    duration_ms: Date.now() - startTime,
  };
}

function bidirectionalBFS(sourceId, targetId, maxDepth) {
  let sourceQueue = [sourceId];
  const sourceVisited = new Set([sourceId]);
  const sourceParents = new Map([[sourceId, null]]);

  let targetQueue = [targetId];
  const targetVisited = new Set([targetId]);
  const targetParents = new Map([[targetId, null]]);

  for (let depth = 0; depth < maxDepth; depth++) {
    if (sourceQueue.length <= targetQueue.length) {
      const meetingPoint = expandLevel(
        sourceQueue,
        sourceVisited,
        sourceParents,
        targetVisited,
        true
      );

      if (meetingPoint !== null) {
        return {
          path: reconstructPath(sourceParents, targetParents, meetingPoint),
        };
      }

      sourceQueue = sourceQueue.slice();
    }

    const meetingPoint = expandLevel(
      targetQueue,
      targetVisited,
      targetParents,
      sourceVisited,
      false
    );

    if (meetingPoint !== null) {
      return {
        path: reconstructPath(sourceParents, targetParents, meetingPoint),
      };
    }

    if (sourceQueue.length === 0 && targetQueue.length === 0) {
      break;
    }
  }

  return null;
}

function expandLevel(queue, visited, parents, otherVisited, isForward) {
  const levelSize = queue.length;
  const newNodes = [];

  for (let i = 0; i < levelSize; i++) {
    const currentId = queue.shift();
    const links = sdowService.getPageLinks(currentId);

    if (!links) continue;

    const neighborIds = isForward ? links.outgoing_links : links.incoming_links;

    for (const neighborId of neighborIds) {
      if (otherVisited.has(neighborId)) {
        parents.set(neighborId, currentId);
        return neighborId;
      }

      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        parents.set(neighborId, currentId);
        newNodes.push(neighborId);
      }
    }
  }

  queue.push(...newNodes);
  return null;
}

function reconstructPath(sourceParents, targetParents, meetingPoint) {
  const pathFromSource = [];
  let current = meetingPoint;

  while (current !== null) {
    pathFromSource.unshift(current);
    current = sourceParents.get(current);
  }

  const pathToTarget = [];
  current = targetParents.get(meetingPoint);

  while (current !== null) {
    pathToTarget.push(current);
    current = targetParents.get(current);
  }

  return [...pathFromSource, ...pathToTarget];
}

export function buildGraph(
  rootTitle,
  maxDepth = 2,
  maxNodes = 50,
  maxNeighborsPerNode = 20
) {
  const rootPage = sdowService.findPageByTitle(rootTitle);

  if (!rootPage) {
    throw new Error(`Article "${rootTitle}" not found`);
  }

  let rootId = rootPage.id;

  if (rootPage.is_redirect) {
    const resolved = sdowService.resolveRedirect(rootPage.id);
    if (resolved) rootId = resolved.target_id;
  }

  const nodes = new Map();
  const links = [];
  const queue = [{ id: rootId, depth: 0 }];
  const visited = new Set([rootId]);

  nodes.set(rootId, {
    id: rootId,
    title: rootPage.title,
    depth: 0,
  });

  while (queue.length > 0 && nodes.size < maxNodes) {
    const { id, depth } = queue.shift();

    if (depth >= maxDepth) continue;

    const linkData = sdowService.getPageLinks(id);
    if (!linkData) continue;

    const neighborIds = linkData.outgoing_links.slice(0, maxNeighborsPerNode);

    for (const neighborId of neighborIds) {
      if (nodes.size >= maxNodes) break;

      links.push({ source: id, target: neighborId });

      if (!visited.has(neighborId)) {
        visited.add(neighborId);

        const neighborPages = sdowService.findPagesByIds([neighborId]);
        if (neighborPages.length > 0) {
          const neighborPage = neighborPages[0];
          nodes.set(neighborId, {
            id: neighborId,
            title: neighborPage.title,
            depth: depth + 1,
          });

          queue.push({ id: neighborId, depth: depth + 1 });
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    links: links,
    node_count: nodes.size,
    link_count: links.length,
  };
}

/**
 * Get neighbors of a specific node
 * @param {string} pageTitle - Title of the page
 * @param {number} maxNeighbors - Maximum number of neighbors to return
 * @returns {Object} Object containing the node and its neighbors
 */
export function getNodeNeighbors(pageTitle, maxNeighbors = null) {
  const page = sdowService.findPageByTitle(pageTitle);

  if (!page) {
    throw new Error(`Article "${pageTitle}" not found`);
  }

  let pageId = page.id;

  if (page.is_redirect) {
    const resolved = sdowService.resolveRedirect(page.id);
    if (resolved) pageId = resolved.target_id;
  }

  const linkData = sdowService.getPageLinks(pageId);
  
  if (!linkData) {
    return {
      node: {
        id: pageId,
        title: page.title,
      },
      neighbors: [],
      links: [],
    };
  }

  // If maxNeighbors is null or non-positive, return all outgoing links
  const neighborIds = maxNeighbors && maxNeighbors > 0
    ? linkData.outgoing_links.slice(0, maxNeighbors)
    : linkData.outgoing_links;
  const neighborPages = sdowService.findPagesByIds(neighborIds);

  const neighbors = neighborPages.map(neighbor => ({
    id: neighbor.id,
    title: neighbor.title,
  }));

  const links = neighborIds.map(neighborId => ({
    source: pageId,
    target: neighborId,
  }));

  return {
    node: {
      id: pageId,
      title: page.title,
    },
    neighbors,
    links,
  };
}

export default {
  findPath,
  buildGraph,
  getNodeNeighbors,
};
