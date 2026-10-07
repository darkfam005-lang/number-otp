import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Lamix API Proxy Route to bypass browser CORS when running in web preview
  app.all('/api/lamix-proxy*', async (req, res) => {
    try {
      // Subpath after /api/lamix-proxy
      const targetSubpath = req.url.replace(/^\/api\/lamix-proxy/, '');
      const defaultHost = 'https://panel.lamix.org';
      
      // Determine target URL
      let targetUrl = `${defaultHost}${targetSubpath.startsWith('/') ? '' : '/'}${targetSubpath}`;
      
      const headers: Record<string, string> = {
        'User-Agent': 'LamixMobileClient/1.0 (Android PWA)',
        'Accept': 'application/json, text/plain, */*',
      };

      if (req.headers['authorization']) {
        headers['authorization'] = req.headers['authorization'] as string;
      }
      if (req.headers['content-type']) {
        headers['content-type'] = req.headers['content-type'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const contentType = response.headers.get('content-type') || '';

      res.status(response.status);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        res.json(jsonData);
      } else {
        const textData = await response.text();
        res.send(textData);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown proxy error';
      console.error('[Lamix Proxy Error]:', errorMessage);
      res.status(502).json({
        error: 'proxy_failed',
        message: 'Could not connect to Lamix gateway. Ensure network is active.',
        details: errorMessage,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lamix Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
