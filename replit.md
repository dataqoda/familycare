# Prontuário Familiar - Family Medical Records System

## Overview

This is a full-stack family medical records management application built with React, Express, and PostgreSQL. The system allows families to manage health information for multiple patients, track medical records, schedule appointments, and monitor pending medical tasks. The application features a dashboard with patient cards, detailed patient views, quick medical record creation, and recent activity tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with dedicated routes for patients, appointments, medical records, pending items, and recent updates
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot module replacement with Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL
- **Storage Interface**: Abstract storage interface with in-memory implementation for development

### Database Schema
- **Patients**: Core patient information (name, age, blood type, doctor, allergies, avatar)
- **Appointments**: Scheduled medical appointments linked to patients
- **Medical Records**: Various types of medical records (exams, medications, appointments, history, incidents)
- **Pending Items**: Tasks and follow-ups with priority levels
- **Recent Updates**: Activity feed for tracking system changes

### Authentication and Authorization
- Currently using a simple in-memory storage system without authentication
- Session management infrastructure is prepared (connect-pg-simple package included)

### API Structure
- GET/POST/PUT/DELETE endpoints for all major entities
- Nested routes for patient-specific data (e.g., `/api/patients/:id/medical-records`)
- Consistent JSON response format with error handling
- Request logging middleware for API monitoring

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: PostgreSQL database connection
- **express**: Node.js web framework

### UI and Styling Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit integration

### Form and Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation library
- **drizzle-zod**: Integration between Drizzle and Zod

### Database and Storage
- **drizzle-kit**: Database migrations and introspection
- **connect-pg-simple**: PostgreSQL session store (prepared for future use)

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx** and **tailwind-merge**: CSS class name utilities
- **cmdk**: Command menu component
- **embla-carousel-react**: Carousel component