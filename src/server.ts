import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

import fs, { existsSync } from 'node:fs';

import {NODES} from './app/mock-graph.data';
import {processUpload} from './server-lib/pipeline';
import {YoloOnnxDetectionEngine} from './server-lib/yolo-engine';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Find the project root by looking for the src directory
function findProjectRoot(currentDir: string): string {
  let dir = currentDir;
  while (!existsSync(join(dir, 'src')) && dir !== '/' && dir.length > 3) {
    dir = join(dir, '..');
  }
  return existsSync(join(dir, 'src')) ? dir : process.cwd();
}

const rootDir = findProjectRoot(process.cwd());
const dataFolder = join(rootDir, 'src/data');

/** Source folder that holds the tracked asset imagery. */
const imagesFolder = resolve(
  process.env['DATA_IMAGES_DIR'] ?? join(rootDir, 'src', 'data-images'),
);

/** Annotated images plus their per-image detection metadata sidecars. */
const taggedFolder = resolve(
  process.env['DATA_TAGGED_DIR'] ?? join(process.cwd(), 'src', 'data-tagged'),
);

const detectionEngine = new YoloOnnxDetectionEngine();
const VALID_NODE_IDS = new Set(NODES.map((n) => n.id));

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', express.json({limit: '15mb'}));
app.use('/data-images', express.static(imagesFolder));
app.use('/data-tagged', express.static(taggedFolder));

app.get('/api/resources', (req, res) => {
  try {
    const resourcesPath = join(dataFolder, 'resources.json');
    const data = fs.readFileSync(resourcesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Failed to read resources.json', err);
    res.status(500).json({error: 'Failed to load resources'});
  }
});

app.post('/api/feed-upload', async (req, res) => {
  const {fileName, mimeType, data, nodeId} = req.body ?? {};

  if (typeof mimeType !== 'string' || !ALLOWED_IMAGE_TYPES[mimeType]) {
    res.status(400).json({error: 'Unsupported image type.'});
    return;
  }
  if (typeof data !== 'string' || !data) {
    res.status(400).json({error: 'Missing image payload.'});
    return;
  }
  if (typeof nodeId !== 'string' || !VALID_NODE_IDS.has(nodeId)) {
    res.status(400).json({
      error: {code: 'INVALID_LOCATION', message: 'The provided location could not be found.'},
    });
    return;
  }

  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    res.status(400).json({error: 'Image must be between 1 byte and 10 MB.'});
    return;
  }

  // Never trust the client name: keep only a safe slug and re-derive the extension.
  const rawBase = typeof fileName === 'string' ? fileName.replace(/\.[^.]*$/, '') : '';
  const slug = rawBase.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60) || 'feed';
  const storedName = `${Date.now()}_${slug}.${ALLOWED_IMAGE_TYPES[mimeType]}`;

  try {
    await mkdir(imagesFolder, {recursive: true});
    await writeFile(join(imagesFolder, storedName), buffer);
  } catch {
    res.status(500).json({error: 'Failed to store the image.'});
    return;
  }

  try {
    const record = await processUpload(buffer, storedName, nodeId, {
      engine: detectionEngine,
      dataFolder,
      taggedFolder,
    });
    res.status(201).json({storedName, size: buffer.length, nodeId, record});
  } catch (err) {
    // The upload itself succeeded, so degrade gracefully if inference is unavailable.
    console.error('Detection pipeline failed', err);
    res.status(201).json({
      storedName,
      size: buffer.length,
      nodeId,
      detectionError: 'Object detection is unavailable for this image.',
    });
  }
});

app.get('/api/detections/:id', async (req, res) => {
  const id = req.params.id;
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    res.status(400).json({error: 'Invalid detection id.'});
    return;
  }
  try {
    res.json(JSON.parse(await readFile(join(taggedFolder, `${id}.json`), 'utf8')));
  } catch {
    res.status(404).json({error: 'Detection metadata not found.'});
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
