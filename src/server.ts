import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

/** Source folder that holds the tracked asset imagery. */
const dataImagesFolder = resolve(
  process.env['DATA_IMAGES_DIR'] ?? join(process.cwd(), 'src', 'data-images'),
);

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

app.post('/api/feed-upload', async (req, res) => {
  const {fileName, mimeType, data} = req.body ?? {};

  if (typeof mimeType !== 'string' || !ALLOWED_IMAGE_TYPES[mimeType]) {
    res.status(400).json({error: 'Unsupported image type.'});
    return;
  }
  if (typeof data !== 'string' || !data) {
    res.status(400).json({error: 'Missing image payload.'});
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
    await mkdir(dataImagesFolder, {recursive: true});
    await writeFile(join(dataImagesFolder, storedName), buffer);
    res.status(201).json({storedName, size: buffer.length});
  } catch {
    res.status(500).json({error: 'Failed to store the image.'});
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
