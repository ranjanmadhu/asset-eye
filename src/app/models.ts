export interface GraphNode {
  id: string;
  name: string;
  type: 'room' | 'corridor' | 'elevator';
  floor: number;
  x: number;
  y: number;
}

export interface FloorArea {
  id: string;
  floor: number;
  type: 'room' | 'corridor' | 'elevator';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  distance: number;
  direction: string;
}

export interface PathResult {
  path: GraphNode[];
  directions: string[];
  distance: number;
}

export interface DetectedResource {
  type: string;
  confidence: number;
}

export interface ResourceData {
  id: string;
  nodeId: string;
  timestamp: string;
  imageUrl: string;
  detectedItems: DetectedResource[];
}

export interface RouteOption {
  resource: ResourceData;
  matchedItem: DetectedResource;
  nodeName: string;
  path: GraphNode[];
  directions: string[];
  distance: number;
  timeAgo: string;
}
