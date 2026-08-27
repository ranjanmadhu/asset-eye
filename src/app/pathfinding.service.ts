import { Injectable } from '@angular/core';
import { GraphEdge, GraphNode, PathResult } from './models';
import { EDGES, NODES } from './mock-graph.data';

@Injectable({
  providedIn: 'root'
})
export class PathfindingService {
  
  getNodes(): GraphNode[] {
    return NODES;
  }

  getEdges(): GraphEdge[] {
    return EDGES;
  }

  getShortestPath(startId: string, endId: string): PathResult {
    if (!startId || !endId) {
      return { path: [], directions: [] };
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    NODES.forEach(n => {
      distances.set(n.id, Infinity);
      unvisited.add(n.id);
    });

    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currId: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach(id => {
        const dist = distances.get(id)!;
        if (dist < minDistance) {
          minDistance = dist;
          currId = id;
        }
      });

      if (currId === null || minDistance === Infinity) {
        break; // Unreachable
      }

      if (currId === endId) {
        break; // Destination found
      }

      unvisited.delete(currId);

      const neighbors = EDGES.filter(e => e.source === currId);
      
      for (const edge of neighbors) {
        if (unvisited.has(edge.target)) {
          const newDist = distances.get(currId)! + edge.distance;
          if (newDist < distances.get(edge.target)!) {
            distances.set(edge.target, newDist);
            previous.set(edge.target, currId);
          }
        }
      }
    }

    // Reconstruct path
    const pathIds: string[] = [];
    let curr: string | undefined = endId;
    
    if (previous.has(curr) || curr === startId) {
      while (curr) {
        pathIds.unshift(curr);
        curr = previous.get(curr);
      }
    }

    if (pathIds.length === 0 || pathIds[0] !== startId) {
      return { path: [], directions: ['No valid route found.'] };
    }

    const pathNodes = pathIds.map(id => NODES.find(n => n.id === id)!);
    const directions = this.generateDirections(pathIds);

    return { path: pathNodes, directions };
  }

  private generateDirections(pathIds: string[]): string[] {
    if (pathIds.length < 2) return ["You are already at the destination."];

    const instructions: string[] = [];
    let currentSegmentDistance = 0;
    
    for (let i = 0; i < pathIds.length - 1; i++) {
      const fromId = pathIds[i];
      const toId = pathIds[i + 1];
      const fromNode = NODES.find(n => n.id === fromId)!;
      const toNode = NODES.find(n => n.id === toId)!;
      const edge = EDGES.find(e => e.source === fromId && e.target === toId)!;

      if (fromNode.floor !== toNode.floor) {
        instructions.push(`Take ${fromNode.name} to Floor ${toNode.floor}.`);
      } else {
        instructions.push(`Walk ${edge.distance}m ${edge.direction} to ${toNode.name}.`);
      }
    }

    instructions.push(`Arrived at ${NODES.find(n => n.id === pathIds[pathIds.length - 1])!.name}.`);
    return instructions;
  }
}
