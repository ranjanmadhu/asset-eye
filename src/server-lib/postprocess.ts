import {COCO_CLASSES} from './coco-classes';
import type {DetectedObject} from './object-detection';
import type {LetterboxResult} from './preprocess';

interface Candidate extends DetectedObject {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Decodes the YOLOv8 `[1, 4 + numClasses, numAnchors]` output: transpose, score
 * threshold, xywh -> xyxy, NMS, then undo the letterbox transform.
 */
export function decodeYoloOutput(
  data: Float32Array,
  dims: readonly number[],
  layout: LetterboxResult,
  scoreThreshold: number,
  iouThreshold: number,
): DetectedObject[] {
  const [, channels, anchors] = dims;
  const numClasses = channels - 4;
  const candidates: Candidate[] = [];

  for (let a = 0; a < anchors; a++) {
    let bestScore = 0;
    let bestClass = -1;
    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * anchors + a];
      if (score > bestScore) {
        bestScore = score;
        bestClass = c;
      }
    }
    if (bestClass < 0 || bestScore < scoreThreshold) continue;

    const cx = data[a];
    const cy = data[anchors + a];
    const w = data[anchors * 2 + a];
    const h = data[anchors * 3 + a];

    candidates.push({
      rawLabel: COCO_CLASSES[bestClass] ?? `class_${bestClass}`,
      classId: bestClass,
      confidence: bestScore,
      box: {x: 0, y: 0, width: 0, height: 0},
      x1: cx - w / 2,
      y1: cy - h / 2,
      x2: cx + w / 2,
      y2: cy + h / 2,
    });
  }

  const kept = nonMaxSuppression(candidates, iouThreshold);
  const {scale, padX, padY, originalWidth, originalHeight} = layout;

  return kept.map((c) => {
    const x1 = clamp((c.x1 - padX) / scale, 0, originalWidth);
    const y1 = clamp((c.y1 - padY) / scale, 0, originalHeight);
    const x2 = clamp((c.x2 - padX) / scale, 0, originalWidth);
    const y2 = clamp((c.y2 - padY) / scale, 0, originalHeight);
    return {
      rawLabel: c.rawLabel,
      classId: c.classId,
      confidence: c.confidence,
      box: {x: x1, y: y1, width: x2 - x1, height: y2 - y1},
    };
  });
}

function nonMaxSuppression(candidates: Candidate[], iouThreshold: number): Candidate[] {
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const kept: Candidate[] = [];

  for (const candidate of sorted) {
    const overlaps = kept.some(
      (k) => k.classId === candidate.classId && iou(k, candidate) > iouThreshold,
    );
    if (!overlaps) kept.push(candidate);
  }
  return kept;
}

function iou(a: Candidate, b: Candidate): number {
  const interWidth = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const interHeight = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  if (interWidth <= 0 || interHeight <= 0) return 0;

  const intersection = interWidth * interHeight;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return intersection / (areaA + areaB - intersection);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
