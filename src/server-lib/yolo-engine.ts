import {join} from 'node:path';
import ort from 'onnxruntime-node';

import type {DetectedObject, ObjectDetectionEngine} from './object-detection';
import {decodeYoloOutput} from './postprocess';
import {letterbox} from './preprocess';

const INPUT_SIZE = 640;

export interface YoloEngineOptions {
  modelPath?: string;
  scoreThreshold?: number;
  iouThreshold?: number;
}

export class YoloOnnxDetectionEngine implements ObjectDetectionEngine {
  private session?: Promise<ort.InferenceSession>;
  private readonly modelPath: string;
  private readonly scoreThreshold: number;
  private readonly iouThreshold: number;

  constructor(options: YoloEngineOptions = {}) {
    this.modelPath =
      options.modelPath ??
      process.env['YOLO_MODEL_PATH'] ??
      join(process.cwd(), 'models', 'yolov8n.onnx');
    this.scoreThreshold = options.scoreThreshold ?? 0.25;
    this.iouThreshold = options.iouThreshold ?? 0.45;
  }

  async detect(image: Buffer): Promise<DetectedObject[]> {
    const session = await this.getSession();
    const layout = await letterbox(image, INPUT_SIZE);

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    const feeds = {
      [inputName]: new ort.Tensor('float32', layout.tensor, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    };

    const results = await session.run(feeds);
    const output = results[outputName];

    return decodeYoloOutput(
      output.data as Float32Array,
      output.dims,
      layout,
      this.scoreThreshold,
      this.iouThreshold,
    );
  }

  private getSession(): Promise<ort.InferenceSession> {
    // Loading the model takes seconds, so keep one session for the process lifetime.
    this.session ??= ort.InferenceSession.create(this.modelPath, {
      executionProviders: ['cpu'],
    }).catch((err) => {
      this.session = undefined;
      throw err;
    });
    return this.session;
  }
}
