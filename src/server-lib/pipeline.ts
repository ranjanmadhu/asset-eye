import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';

import {annotate} from './annotate';
import {applyLabelMap, loadLabelMap, type MappedDetection} from './label-map';
import type {ObjectDetectionEngine} from './object-detection';

export interface DetectionRecord {
  rawLabel: string;
  type: string;
  /** Percentage, matching the 0-100 convention already used in resources.json. */
  confidence: number;
  box: {x: number; y: number; width: number; height: number};
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

export interface PipelineOptions {
  engine: ObjectDetectionEngine;
  dataFolder: string;
  taggedFolder: string;
}

export async function processUpload(
  image: Buffer,
  storedName: string,
  nodeId: string,
  options: PipelineOptions,
): Promise<DetectionMetadata> {
  const {engine, dataFolder, taggedFolder} = options;

  const config = await loadLabelMap(dataFolder);
  const metadata = await sharp(image).rotate().metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const mapped = applyLabelMap(await engine.detect(image), config);
  const tagged = await annotate(image, mapped, width, height);

  const base = storedName.replace(/\.[^.]*$/, '');
  const taggedName = `${base}_tagged.jpg`;

  await mkdir(taggedFolder, {recursive: true});
  await writeFile(join(taggedFolder, taggedName), tagged);

  const record: DetectionMetadata = {
    id: base,
    sourceImage: storedName,
    sourceImageUrl: `/data-images/${encodeURIComponent(storedName)}`,
    taggedImage: taggedName,
    taggedImageUrl: `/data-tagged/${encodeURIComponent(taggedName)}`,
    nodeId,
    capturedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    modelVersion: config.modelVersion,
    imageWidth: width,
    imageHeight: height,
    detections: mapped.map(toRecord),
  };

  await writeFile(
    join(taggedFolder, `${base}.json`),
    JSON.stringify(record, null, 2),
  );
  await appendResource(dataFolder, record);

  return record;
}

function toRecord(d: MappedDetection): DetectionRecord {
  return {
    rawLabel: d.rawLabel,
    type: d.type,
    confidence: Number((d.confidence * 100).toFixed(1)),
    box: {
      x: Math.round(d.box.x),
      y: Math.round(d.box.y),
      width: Math.round(d.box.width),
      height: Math.round(d.box.height),
    },
  };
}

// Serialised so concurrent uploads cannot clobber each other's read-modify-write.
let writeQueue: Promise<unknown> = Promise.resolve();

function appendResource(dataFolder: string, record: DetectionMetadata): Promise<void> {
  const task = writeQueue.then(async () => {
    const path = join(dataFolder, 'resources.json');
    const existing = JSON.parse(await readFile(path, 'utf8'));
    existing.push({
      id: record.id,
      nodeId: record.nodeId,
      timestamp: record.capturedAt,
      imageUrl: record.taggedImageUrl,
      detectedItems: record.detections.map((d) => ({
        type: d.type,
        confidence: d.confidence,
      })),
    });
    await writeFile(path, JSON.stringify(existing, null, 2));
  });

  writeQueue = task.catch(() => undefined);
  return task;
}
