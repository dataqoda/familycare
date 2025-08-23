import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertAppointmentSchema, insertMedicalRecordSchema, insertPendingItemSchema, insertRecentUpdateSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configuração do multer para upload de arquivos
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log('Arquivo sendo filtrado:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Permitir apenas arquivos de imagem e documentos
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      console.log('Arquivo aceito:', file.originalname);
      return cb(null, true);
    } else {
      console.log('Arquivo rejeitado:', file.originalname, 'mimetype:', file.mimetype);
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Patients routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);

      // Create recent update
      await storage.createRecentUpdate({
        patientId: patient.id,
        patientName: patient.name,
        description: "Novo paciente cadastrado",
        icon: "👤"
      });

      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePatient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Appointments routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Medical Records routes
  app.get("/api/medical-records", async (req, res) => {
    try {
      const { patientId } = req.query;
      let records;

      if (patientId) {
        records = await storage.getMedicalRecordsByPatient(patientId as string);
      } else {
        records = await storage.getMedicalRecords();
      }

      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medical records" });
    }
  });

  app.post("/api/medical-records", async (req, res) => {
    try {
      const validatedData = insertMedicalRecordSchema.parse(req.body);
      const record = await storage.createMedicalRecord(validatedData);

      // Create recent update
      const patient = await storage.getPatient(record.patientId);
      if (patient) {
        const typeIcons = {
          exam: "📋",
          medication: "💊",
          appointment: "📅",
          history: "📝",
          incident: "⚠️",
          pending: "📋"
        };

        await storage.createRecentUpdate({
          patientId: patient.id,
          patientName: patient.name,
          description: `Novo registro adicionado: ${record.type}`,
          icon: typeIcons[record.type as keyof typeof typeIcons] || "📝"
        });
      }

      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create medical record" });
    }
  });

  // Pending Items routes
  app.get("/api/pending-items", async (req, res) => {
    try {
      const pendingItems = await storage.getPendingItems();
      res.json(pendingItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending items" });
    }
  });

  app.post("/api/pending-items", async (req, res) => {
    try {
      const validatedData = insertPendingItemSchema.parse(req.body);
      const item = await storage.createPendingItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pending item" });
    }
  });

  app.put("/api/medical-records/:id", async (req, res) => {
    try {
      const validatedData = insertMedicalRecordSchema.partial().parse(req.body);
      const record = await storage.updateMedicalRecord(req.params.id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update medical record" });
    }
  });

  app.delete("/api/medical-records/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMedicalRecord(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Medical record not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medical record" });
    }
  });

  // Recent Updates routes
  app.get("/api/recent-updates", async (req, res) => {
    try {
      const updates = await storage.getRecentUpdates();
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent updates" });
    }
  });

  // Upload de arquivos
  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        console.log("Nenhum arquivo recebido no upload");
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      console.log("Arquivo recebido:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      const response = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size
      };

      console.log("Resposta do upload:", response);
      res.json(response);
    } catch (error) {
      console.error("Erro no upload do arquivo:", error);
      res.status(500).json({ error: "Erro no upload do arquivo" });
    }
  });

  // Servir arquivos uploadados
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    console.log("Requisição de arquivo:", {
      filename,
      filePath,
      exists: fs.existsSync(filePath),
      uploadDir: process.cwd() + '/uploads',
      files: fs.existsSync(path.join(process.cwd(), 'uploads')) ? fs.readdirSync(path.join(process.cwd(), 'uploads')) : 'pasta não existe'
    });

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        console.log("Estatísticas do arquivo:", {
          size: stats.size,
          modified: stats.mtime
        });

        // Adicionar headers CORS
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        
        // Definir o tipo de conteúdo baseado na extensão
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        
        if (mimeTypes[ext]) {
          res.setHeader('Content-Type', mimeTypes[ext]);
        }
        
        // Adicionar headers para cache
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Length', stats.size);
        
        res.sendFile(filePath);
      } catch (error) {
        console.error("Erro ao ler arquivo:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    } else {
      console.log("Arquivo não encontrado:", filePath);
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}