import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Advanced rate limiting for cost protection
const rateLimit = new Map();
const requestCounts = new Map();
const dailyLimits = new Map();

// Configurações de proteção
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 30; // Máximo 30 req/min por IP
const MAX_DAILY_REQUESTS = 500; // Máximo 500 req/dia por IP
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB máximo por upload
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos de bloqueio

const app = express();

// Limitar tamanho do body para uploads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Middleware de proteção avançada
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const today = new Date().toDateString();
  
  // Verificar se IP está bloqueado
  const blocked = rateLimit.get(`blocked:${ip}`);
  if (blocked && now < blocked) {
    return res.status(429).json({ 
      message: "IP temporariamente bloqueado. Tente novamente mais tarde.",
      retryAfter: Math.ceil((blocked - now) / 1000)
    });
  }
  
  // Rate limiting por minuto
  const minuteKey = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  const minuteCount = rateLimit.get(minuteKey) || 0;
  
  if (minuteCount >= MAX_REQUESTS_PER_MINUTE) {
    // Bloquear IP por 15 minutos se exceder muito o limite
    if (minuteCount > MAX_REQUESTS_PER_MINUTE * 2) {
      rateLimit.set(`blocked:${ip}`, now + BLOCK_DURATION);
    }
    return res.status(429).json({ 
      message: "Limite de requisições por minuto excedido.",
      retryAfter: 60
    });
  }
  
  // Limite diário
  const dailyKey = `${ip}:${today}`;
  const dailyCount = dailyLimits.get(dailyKey) || 0;
  
  if (dailyCount >= MAX_DAILY_REQUESTS) {
    return res.status(429).json({ 
      message: "Limite diário de requisições excedido. Tente novamente amanhã.",
      retryAfter: 86400
    });
  }
  
  // Incrementar contadores
  rateLimit.set(minuteKey, minuteCount + 1);
  dailyLimits.set(dailyKey, dailyCount + 1);
  
  // Limpar contadores antigos a cada hora
  if (Math.random() < 0.01) {
    const oneHourAgo = now - 3600000;
    for (const [key, value] of rateLimit.entries()) {
      if (typeof value === 'number' && parseInt(key.split(':')[1]) * RATE_LIMIT_WINDOW < oneHourAgo) {
        rateLimit.delete(key);
      }
    }
  }
  
  next();
});

// Middleware de timeout para requests
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout" });
    }
  }, 30000); // 30 segundos timeout
  
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));
  
  next();
});

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

      // Log requests caras (> 1 segundo)
      if (duration > 1000) {
        log(`⚠️ SLOW REQUEST: ${logLine}`);
      } else {
        log(logLine);
      }
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
