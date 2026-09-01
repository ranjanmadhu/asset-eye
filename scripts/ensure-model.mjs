import {createWriteStream} from 'node:fs';
import {mkdir, rename, stat, unlink} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';

const modelPath = resolve(process.env.YOLO_MODEL_PATH ?? 'models/yolov8n.onnx');
const modelUrl =
  process.env.YOLO_MODEL_URL ??
  'https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.onnx';
const temporaryPath = `${modelPath}.${process.pid}.download`;

try {
  try {
    const existingModel = await stat(modelPath);
    if (existingModel.isFile() && existingModel.size > 0) {
      console.log(`YOLO model is ready: ${modelPath}`);
      process.exit(0);
    }
  } catch {
    // The model is not present yet.
  }

  await mkdir(dirname(modelPath), {recursive: true});
  console.log(`Downloading YOLO model from ${modelUrl}`);

  const response = await fetch(modelUrl, {redirect: 'follow'});
  if (!response.ok) {
    throw new Error(`Model download failed with HTTP ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error('Model download returned an empty response body');
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporaryPath));
  const downloadedModel = await stat(temporaryPath);
  if (downloadedModel.size === 0) {
    throw new Error('Model download returned an empty file');
  }

  await rename(temporaryPath, modelPath);
  console.log(`YOLO model downloaded to ${modelPath}`);
} catch (error) {
  await unlink(temporaryPath).catch(() => undefined);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}