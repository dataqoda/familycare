import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Proteção básica contra abuso
const rateLimit = new Map();
const MAX_REQUESTS_PER_MINUTE = 60; // 60 requests por minuto por IP
const RATE_LIMIT_WINDOW = 60000; // 1 minuto

const app = express();

// Middleware de rate limiting simples
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW);
  const key = `${ip}:${windowStart}`;
  
  const requests = rateLimit.get(key) || 0;
  
  if (requests >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ 
      message: "Muitas requisições. Tente novamente em 1 minuto.",
      retryAfter: 60
    });
  }
  
  rateLimit.set(key, requests + 1);
  
  // Limpar cache antigo ocasionalmente
  if (Math.random() < 0.01) {
    const currentWindow = Math.floor(now / RATE_LIMIT_WINDOW);
    for (const [k] of rateLimit.entries()) {
      const window = parseInt(k.split(':')[1]);
      if (window < currentWindow - 1) {
        rateLimit.delete(k);
      }
    }
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
