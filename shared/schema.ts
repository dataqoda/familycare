import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  birthDate: date("birth_date").notNull(),
  bloodType: text("blood_type"),
  doctor: text("doctor"),
  allergies: text("allergies").array().default([]),
  photoUrl: text("photo_url"),
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  // Insurance information
  insurancePlan: text("insurance_plan"),
  insuranceNumber: text("insurance_number"),
  insuranceCardFrontUrl: text("insurance_card_front_url"),
  insuranceCardBackUrl: text("insurance_card_back_url"),
  idCardFrontUrl: text("id_card_front_url"),
  idCardBackUrl: text("id_card_back_url"),
  // Security
  sensitiveDataPasswordActive: boolean("sensitive_data_password_active").default(false),
  sensitiveDataPassword: text("sensitive_data_password"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  patientName: text("patient_name").notNull(),
  specialty: text("specialty").notNull(),
  doctor: text("doctor").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  type: text("type").notNull(), // 'exam', 'medication', 'appointment', 'history', 'incident', 'pending', 'credential'

  // Common fields
  title: text("title"),
  description: text("description"),
  date: text("date").notNull(),
  attachments: text("attachments").array().default([]),

  // Exam specific fields
  examType: text("exam_type"),
  requestingDoctor: text("requesting_doctor"),
  observations: text("observations"),

  // Medication specific fields
  medicationName: text("medication_name"),
  frequency: text("frequency"),
  usageType: text("usage_type"), // 'continuous', 'temporary'
  periodOfDay: text("period_of_day"), // 'morning', 'afternoon', 'evening', 'dawn', 'any'
  startDate: text("start_date"),
  duration: text("duration"),
  prescribingDoctor: text("prescribing_doctor"),
  indication: text("indication"),

  // Appointment specific fields
  clinicHospital: text("clinic_hospital"),
  doctor: text("doctor"),
  specialty: text("specialty"),
  address: text("address"),
  mapUrl: text("map_url"),
  time: text("time"),

  // Pending specific fields
  deadline: text("deadline"),

  // Credential specific fields
  serviceName: text("service_name"),
  serviceUrl: text("service_url"),
  username: text("username"),
  password: text("password"),
  additionalNotes: text("additional_notes"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const pendingItems = pgTable("pending_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high'
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recentUpdates = pgTable("recent_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  patientName: text("patient_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  photoUrl: z.string().nullish().transform(val => val || undefined),
  bloodType: z.string().nullish().transform(val => val || undefined),
  doctor: z.string().nullish().transform(val => val || undefined),
  allergies: z.array(z.string()).optional(),
  emergencyContactName: z.string().nullish().transform(val => val || undefined),
  emergencyContactPhone: z.string().nullish().transform(val => val || undefined),
  insurancePlan: z.string().nullish().transform(val => val || undefined),
  insuranceNumber: z.string().nullish().transform(val => val || undefined),
  insuranceCardFrontUrl: z.string().nullish().transform(val => val || undefined),
  insuranceCardBackUrl: z.string().nullish().transform(val => val || undefined),
  idCardFrontUrl: z.string().nullish().transform(val => val || undefined),
  idCardBackUrl: z.string().nullish().transform(val => val || undefined),
  sensitiveDataPasswordActive: z.boolean().optional(),
  sensitiveDataPassword: z.string().nullish().transform(val => val || undefined),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
});

export const insertPendingItemSchema = createInsertSchema(pendingItems).omit({
  id: true,
  createdAt: true,
});

export const insertRecentUpdateSchema = createInsertSchema(recentUpdates).omit({
  id: true,
  createdAt: true,
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type PendingItem = typeof pendingItems.$inferSelect;
export type InsertPendingItem = z.infer<typeof insertPendingItemSchema>;
export type RecentUpdate = typeof recentUpdates.$inferSelect;
export type InsertRecentUpdate = z.infer<typeof insertRecentUpdateSchema>;