export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  rawLabel: string;
  classId: number;
  /** 0-1 model score. */
  confidence: number;
  /** Pixel coordinates in the original (un-letterboxed) image. */
  box: BoundingBox;
}

export interface ObjectDetectionEngine {
  detect(image: Buffer): Promise<DetectedObject[]>;
}
