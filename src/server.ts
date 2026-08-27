import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

import fs from 'node:fs';

const browserDistFolder = join(import.meta.dirname, '../browser');
const dataFolder = join(process.cwd(), 'src/data');
const imagesFolder = join(process.cwd(), 'src/data-images');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/data-images', express.static(imagesFolder));

/**
 * Example Express Rest API endpoints can be defined here.
 */
app.get('/api/resources', (req, res) => {
  try {
    const resourcesPath = join(dataFolder, 'resources.json');
    const data = fs.readFileSync(resourcesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Failed to read resources.json', err);
    res.status(500).json({ error: 'Failed to load resources' });
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
