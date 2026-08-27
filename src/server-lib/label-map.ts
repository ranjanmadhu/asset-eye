import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

import type {DetectedObject} from './object-detection';

export interface LabelMapConfig {
  modelVersion: string;
  minConfidence: number;
  dropUnmapped: boolean;
  aliases: Record<string, string>;
}

export interface MappedDetection extends DetectedObject {
  /** Hospital-facing label derived from the COCO class. */
  type: string;
}

const FALLBACK: LabelMapConfig = {
  modelVersion: 'yolov8n',
  minConfidence: 0.35,
  dropUnmapped: true,
  aliases: {},
};

let cached: Promise<LabelMapConfig> | undefined;

export function loadLabelMap(dataFolder: string): Promise<LabelMapConfig> {
  cached ??= readFile(join(dataFolder, 'label-map.json'), 'utf8')
    .then((raw) => ({...FALLBACK, ...JSON.parse(raw)}) as LabelMapConfig)
    .catch(() => FALLBACK);
  return cached;
}

export function applyLabelMap(
  detections: DetectedObject[],
  config: LabelMapConfig,
): MappedDetection[] {
  return detections
    .filter((d) => d.confidence >= config.minConfidence)
    .map((d) => ({...d, type: config.aliases[d.rawLabel] ?? d.rawLabel}))
    .filter((d) => !config.dropUnmapped || d.rawLabel in config.aliases)
    .sort((a, b) => b.confidence - a.confidence);
}
