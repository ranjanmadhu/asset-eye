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

export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionRecord {
  rawLabel: string;
  type: string;
  confidence: number;
  box: DetectionBox;
}

export interface DetectionMetadata {
  id: string;
  sourceImage: string;
  sourceImageUrl: string;
  taggedImage: string;
  taggedImageUrl: string;
  nodeId: string;
  capturedAt: string;
  processedAt: string;
  modelVersion: string;
  imageWidth: number;
  imageHeight: number;
  detections: DetectionRecord[];
}

export interface FeedUploadResponse {
  storedName: string;
  size: number;
  nodeId: string;
  record?: DetectionMetadata;
  detectionError?: string;
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
