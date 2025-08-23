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

  private initializeData() {
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

    // Sample appointments will be created when users add them

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