import { 
  type Patient, 
  type InsertPatient,
  type Appointment,
  type InsertAppointment,
  type MedicalRecord,
  type InsertMedicalRecord,
  type PendingItem,
  type InsertPendingItem,
  type RecentUpdate,
  type InsertRecentUpdate
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: string): Promise<boolean>;

  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Medical Records
  getMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined>;
  deleteMedicalRecord(id: string): Promise<boolean>;

  // Pending Items
  getPendingItems(): Promise<PendingItem[]>;
  getPendingItemsByPatient(patientId: string): Promise<PendingItem[]>;
  createPendingItem(item: InsertPendingItem): Promise<PendingItem>;
  updatePendingItem(id: string, item: Partial<InsertPendingItem>): Promise<PendingItem | undefined>;
  deletePendingItem(id: string): Promise<boolean>;

  // Recent Updates
  getRecentUpdates(): Promise<RecentUpdate[]>;
  createRecentUpdate(update: InsertRecentUpdate): Promise<RecentUpdate>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private medicalRecords: Map<string, MedicalRecord> = new Map();
  private pendingItems: Map<string, PendingItem> = new Map();
  private recentUpdates: Map<string, RecentUpdate> = new Map();

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize with sample family data
    const familyMembers = [
      { 
        name: "João Silva", 
        birthDate: "1979-01-15", 
        bloodType: "O+", 
        doctor: "Dr. Santos", 
        allergies: ["Penicilina", "Amendoim"], 
        photoUrl: "👨",
        emergencyContactName: "Maria Silva",
        emergencyContactPhone: "(11) 99999-8888",
        insurancePlan: "Unimed",
        insuranceNumber: "123456789"
      },
      { 
        name: "Maria Silva", 
        birthDate: "1982-03-22", 
        bloodType: "A+", 
        doctor: "Dra. Costa", 
        allergies: ["Aspirina"], 
        photoUrl: "👩",
        emergencyContactName: "João Silva",
        emergencyContactPhone: "(11) 99999-7777",
        insurancePlan: "Unimed",
        insuranceNumber: "987654321"
      },
      { 
        name: "Ana Silva", 
        birthDate: "2008-07-10", 
        bloodType: "B+", 
        doctor: "Dr. Oliveira", 
        allergies: [], 
        photoUrl: "👧",
        emergencyContactName: "João Silva",
        emergencyContactPhone: "(11) 99999-7777",
        insurancePlan: "Unimed",
        insuranceNumber: "456789123"
      },
      { 
        name: "Pedro Silva", 
        birthDate: "2012-11-05", 
        bloodType: "O+", 
        doctor: "Dr. Lima", 
        allergies: ["Pólen"], 
        photoUrl: "👦",
        emergencyContactName: "Maria Silva",
        emergencyContactPhone: "(11) 99999-8888",
        insurancePlan: "Unimed",
        insuranceNumber: "789123456"
      }
    ];

    familyMembers.forEach(member => {
      const patient: Patient = {
        id: randomUUID(),
        ...member,
        sensitiveDataPasswordActive: false,
        sensitiveDataPassword: null,
        insuranceCardFrontUrl: null,
        insuranceCardBackUrl: null,
        idCardFrontUrl: null,
        idCardBackUrl: null,
        createdAt: new Date()
      };
      this.patients.set(patient.id, patient);
    });

    // Add sample medical records for testing
    const sampleMedicalRecords = [
      // João Silva - Exames
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'exam',
        title: 'Exame de Sangue Completo',
        description: 'Hemograma completo com contagem de plaquetas',
        date: '2024-01-15',
        examType: 'Laboratorial',
        requestingDoctor: 'Dr. Santos',
        observations: 'Valores dentro da normalidade'
      },
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'exam',
        title: 'Raio-X de Tórax',
        description: 'Radiografia do tórax para avaliação pulmonar',
        date: '2024-01-20',
        examType: 'Imagem',
        requestingDoctor: 'Dr. Santos',
        observations: 'Sem alterações significativas'
      },
      // João Silva - Medicações
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'medication',
        title: 'Losartana 50mg',
        description: 'Para controle da pressão arterial',
        date: '2024-01-10',
        medicationName: 'Losartana',
        frequency: '1x ao dia',
        usageType: 'continuous',
        periodOfDay: 'morning',
        prescribingDoctor: 'Dr. Santos',
        indication: 'Hipertensão arterial'
      },
      // João Silva - Consultas
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'appointment',
        title: 'Consulta Cardiológica',
        description: 'Avaliação cardiovascular de rotina',
        date: '2024-02-15',
        time: '14:30',
        doctor: 'Dr. Cardoso',
        specialty: 'Cardiologia',
        clinicHospital: 'Hospital São Lucas',
        address: 'Rua das Flores, 123'
      },
      // João Silva - Histórico
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'history',
        title: 'Cirurgia de Apendicite',
        description: 'Apendicectomia realizada em 2020 sem complicações',
        date: '2020-08-15'
      },
      // João Silva - Incidente
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'incident',
        title: 'Queda em Casa',
        description: 'Paciente sofreu queda no banheiro, sem fraturas',
        date: '2024-01-25'
      },
      // João Silva - Credencial
      {
        patientId: Array.from(this.patients.values())[0].id,
        type: 'credential',
        title: 'Portal do Paciente - Hospital São Lucas',
        description: 'Acesso ao portal online do hospital',
        date: '2024-01-05',
        serviceName: 'Portal São Lucas',
        serviceUrl: 'https://portal.saolucas.com.br',
        username: 'joao.silva',
        password: 'senha123',
        additionalNotes: 'Primeiro acesso requer troca de senha'
      },

      // Maria Silva - Exames
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'exam',
        title: 'Mamografia',
        description: 'Exame preventivo de mama',
        date: '2024-01-12',
        examType: 'Imagem',
        requestingDoctor: 'Dra. Costa',
        observations: 'Resultado normal, próximo exame em 1 ano'
      },
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'exam',
        title: 'Papanicolau',
        description: 'Exame preventivo ginecológico',
        date: '2024-01-18',
        examType: 'Laboratorial',
        requestingDoctor: 'Dra. Costa',
        observations: 'Células normais'
      },
      // Maria Silva - Medicações
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'medication',
        title: 'Vitamina D3',
        description: 'Suplementação vitamínica',
        date: '2024-01-08',
        medicationName: 'Colecalciferol',
        frequency: '1x por semana',
        usageType: 'temporary',
        periodOfDay: 'morning',
        duration: '3 meses',
        prescribingDoctor: 'Dra. Costa',
        indication: 'Deficiência de vitamina D'
      },
      // Maria Silva - Consultas
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'appointment',
        title: 'Consulta Ginecológica',
        description: 'Consulta de rotina e preventivo',
        date: '2024-02-20',
        time: '10:00',
        doctor: 'Dra. Costa',
        specialty: 'Ginecologia',
        clinicHospital: 'Clínica Feminina',
        address: 'Av. Paulista, 456'
      },
      // Maria Silva - Histórico
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'history',
        title: 'Parto Normal - Ana',
        description: 'Parto normal da filha Ana em 2008, sem complicações',
        date: '2008-07-10'
      },
      // Maria Silva - Credencial
      {
        patientId: Array.from(this.patients.values())[1].id,
        type: 'credential',
        title: 'App Unimed',
        description: 'Aplicativo do plano de saúde',
        date: '2024-01-03',
        serviceName: 'Unimed App',
        serviceUrl: 'https://app.unimed.com.br',
        username: 'maria.silva82',
        password: 'unimed2024',
        additionalNotes: 'Renovar senha a cada 6 meses'
      },

      // Ana Silva - Exames
      {
        patientId: Array.from(this.patients.values())[2].id,
        type: 'exam',
        title: 'Exame Oftalmológico',
        description: 'Avaliação da visão e saúde ocular',
        date: '2024-01-22',
        examType: 'Clínico',
        requestingDoctor: 'Dr. Oliveira',
        observations: 'Visão normal para a idade'
      },
      // Ana Silva - Medicações
      {
        patientId: Array.from(this.patients.values())[2].id,
        type: 'medication',
        title: 'Xarope para Tosse',
        description: 'Tratamento para tosse seca',
        date: '2024-01-28',
        medicationName: 'Dextrometorfano',
        frequency: '3x ao dia',
        usageType: 'temporary',
        periodOfDay: 'any',
        duration: '7 dias',
        prescribingDoctor: 'Dr. Oliveira',
        indication: 'Tosse seca persistente'
      },
      // Ana Silva - Consultas
      {
        patientId: Array.from(this.patients.values())[2].id,
        type: 'appointment',
        title: 'Consulta Pediátrica',
        description: 'Acompanhamento do crescimento e desenvolvimento',
        date: '2024-03-10',
        time: '15:00',
        doctor: 'Dr. Oliveira',
        specialty: 'Pediatria',
        clinicHospital: 'Clínica Infantil',
        address: 'Rua das Crianças, 789'
      },
      // Ana Silva - Histórico
      {
        patientId: Array.from(this.patients.values())[2].id,
        type: 'history',
        title: 'Vacinação HPV',
        description: 'Primeira dose da vacina contra HPV',
        date: '2023-07-10'
      },
      // Ana Silva - Incidente
      {
        patientId: Array.from(this.patients.values())[2].id,
        type: 'incident',
        title: 'Queda da Bicicleta',
        description: 'Escoriações no joelho direito, curativo realizado',
        date: '2024-01-30'
      },

      // Pedro Silva - Exames
      {
        patientId: Array.from(this.patients.values())[3].id,
        type: 'exam',
        title: 'Teste Alérgico',
        description: 'Teste cutâneo para identificação de alérgenos',
        date: '2024-01-14',
        examType: 'Clínico',
        requestingDoctor: 'Dr. Lima',
        observations: 'Positivo para pólen de gramíneas'
      },
      // Pedro Silva - Medicações
      {
        patientId: Array.from(this.patients.values())[3].id,
        type: 'medication',
        title: 'Antialérgico Infantil',
        description: 'Para controle dos sintomas alérgicos',
        date: '2024-01-16',
        medicationName: 'Loratadina',
        frequency: '1x ao dia',
        usageType: 'continuous',
        periodOfDay: 'evening',
        prescribingDoctor: 'Dr. Lima',
        indication: 'Rinite alérgica'
      },
      // Pedro Silva - Consultas
      {
        patientId: Array.from(this.patients.values())[3].id,
        type: 'appointment',
        title: 'Consulta com Alergista',
        description: 'Avaliação e ajuste do tratamento para alergia',
        date: '2024-02-28',
        time: '16:30',
        doctor: 'Dra. Almeida',
        specialty: 'Alergologia',
        clinicHospital: 'Centro de Alergia',
        address: 'Rua da Saúde, 321'
      },
      // Pedro Silva - Histórico
      {
        patientId: Array.from(this.patients.values())[3].id,
        type: 'history',
        title: 'Primeira Crise Alérgica',
        description: 'Primeira manifestação de rinite alérgica aos 8 anos',
        date: '2020-11-05'
      },
      // Pedro Silva - Credencial
      {
        patientId: Array.from(this.patients.values())[3].id,
        type: 'credential',
        title: 'Portal Escolar',
        description: 'Acesso ao sistema da escola para acompanhamento médico',
        date: '2024-01-02',
        serviceName: 'Portal Escola ABC',
        serviceUrl: 'https://escola-abc.edu.br',
        username: 'pedro.silva',
        password: 'escola123',
        additionalNotes: 'Informações médicas compartilhadas com enfermaria'
      }
    ];

    // Create medical records
    sampleMedicalRecords.forEach(recordData => {
      const record: MedicalRecord = {
        id: randomUUID(),
        ...recordData,
        attachments: [],
        createdAt: new Date()
      };
      this.medicalRecords.set(record.id, record);
    });

    // Add sample pending items
    const samplePendingItems = [
      {
        patientId: Array.from(this.patients.values())[0].id,
        title: 'Agendar Retorno Cardiológico',
        description: 'Marcar consulta de retorno em 6 meses',
        priority: 'medium'
      },
      {
        patientId: Array.from(this.patients.values())[1].id,
        title: 'Renovar Receita Vitamina D',
        description: 'Solicitar nova receita com a Dra. Costa',
        priority: 'high'
      },
      {
        patientId: Array.from(this.patients.values())[2].id,
        title: 'Agendar Consulta Ortodôntica',
        description: 'Primeira consulta para avaliação ortodôntica',
        priority: 'low'
      },
      {
        patientId: Array.from(this.patients.values())[3].id,
        title: 'Comprar Medicação Antialérgica',
        description: 'Renovar estoque da Loratadina',
        priority: 'medium'
      }
    ];

    // Create pending items
    samplePendingItems.forEach(itemData => {
      const item: PendingItem = {
        id: randomUUID(),
        ...itemData,
        completed: false,
        createdAt: new Date()
      };
      this.pendingItems.set(item.id, item);
    });

    // Add sample recent updates
    const updates = [
      { patientName: "João Silva", description: "Novo exame de sangue adicionado", icon: "📋" },
      { patientName: "Maria Silva", description: "Medicação atualizada", icon: "💊" },
      { patientName: "Ana Silva", description: "Consulta agendada com Dr. Oliveira", icon: "📅" }
    ];

    updates.forEach(update => {
      const patient = Array.from(this.patients.values()).find(p => p.name === update.patientName);
      if (patient) {
        const recentUpdate: RecentUpdate = {
          id: randomUUID(),
          patientId: patient.id,
          ...update,
          createdAt: new Date()
        };
        this.recentUpdates.set(recentUpdate.id, recentUpdate);
      }
    });
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { 
      ...insertPatient, 
      id, 
      createdAt: new Date() 
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const updatedPatient: Patient = { ...patient, ...updateData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: string): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(a => a.patientId === patientId);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt: new Date() 
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, updateData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updatedAppointment: Appointment = { ...appointment, ...updateData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Medical Records
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values());
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return Array.from(this.medicalRecords.values()).filter(r => r.patientId === patientId);
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    const id = randomUUID();
    const record: MedicalRecord = { 
      ...insertRecord, 
      id, 
      createdAt: new Date() 
    };
    this.medicalRecords.set(id, record);
    return record;
  }

  async updateMedicalRecord(id: string, updateData: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    const record = this.medicalRecords.get(id);
    if (!record) return undefined;

    const updatedRecord: MedicalRecord = { ...record, ...updateData };
    this.medicalRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteMedicalRecord(id: string): Promise<boolean> {
    return this.medicalRecords.delete(id);
  }

  // Pending Items
  async getPendingItems(): Promise<PendingItem[]> {
    return Array.from(this.pendingItems.values());
  }

  async getPendingItemsByPatient(patientId: string): Promise<PendingItem[]> {
    return Array.from(this.pendingItems.values()).filter(i => i.patientId === patientId);
  }

  async createPendingItem(insertItem: InsertPendingItem): Promise<PendingItem> {
    const id = randomUUID();
    const item: PendingItem = { 
      ...insertItem, 
      id, 
      createdAt: new Date() 
    };
    this.pendingItems.set(id, item);
    return item;
  }

  async updatePendingItem(id: string, updateData: Partial<InsertPendingItem>): Promise<PendingItem | undefined> {
    const item = this.pendingItems.get(id);
    if (!item) return undefined;

    const updatedItem: PendingItem = { ...item, ...updateData };
    this.pendingItems.set(id, updatedItem);
    return updatedItem;
  }

  async deletePendingItem(id: string): Promise<boolean> {
    return this.pendingItems.delete(id);
  }

  // Recent Updates
  async getRecentUpdates(): Promise<RecentUpdate[]> {
    return Array.from(this.recentUpdates.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createRecentUpdate(insertUpdate: InsertRecentUpdate): Promise<RecentUpdate> {
    const id = randomUUID();
    const update: RecentUpdate = { 
      ...insertUpdate, 
      id, 
      createdAt: new Date() 
    };
    this.recentUpdates.set(id, update);
    return update;
  }
}

export const storage = new MemStorage();