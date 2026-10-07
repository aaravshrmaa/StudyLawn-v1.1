import dotenv from 'dotenv';
process.env.DOTENV_CONFIG_QUIET = 'true';
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 StudyLawn running at http://localhost:${PORT}/\n`);
  });

  server.on('error', (err: any) => {
    console.error('Server error:', err);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
