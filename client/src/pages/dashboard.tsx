import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import AdvancedQuickRegisterModal from "@/components/advanced-quick-register-modal";
import ImprovedPatientRegisterModal from "@/components/improved-patient-register-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Patient, Appointment, PendingItem, RecentUpdate, MedicalRecord } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showPatientRegister, setShowPatientRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: pendingItems = [] } = useQuery<PendingItem[]>({
    queryKey: ["/api/pending-items"],
  });

  // Combinar pendências das duas fontes
  const allPendingItems = [
    ...pendingItems.map(item => ({
      id: item.id,
      patientId: item.patientId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      completed: item.completed,
      isFromMedicalRecord: false
    })),
    ...medicalRecords
      .filter(record => record.type === 'pending')
      .map(record => {
        return {
          id: record.id,
          patientId: record.patientId,
          title: record.title || record.description || 'Pendência',
          description: record.description,
          priority: 'medium' as const,
          completed: false,
          isFromMedicalRecord: true
        };
      })
  ].filter(item => !item.completed);

  // Combinar consultas das duas fontes e filtrar apenas futuras
  const upcomingAppointments = [
    ...appointments.map(apt => ({
      id: apt.id,
      patientName: apt.patientName,
      specialty: apt.specialty,
      doctor: apt.doctor,
      date: apt.date,
      time: apt.time,
      location: apt.location,
      isFromMedicalRecord: false
    })),
    ...medicalRecords
      .filter(record => record.type === 'appointment')
      .map(record => {
        const patient = patients.find(p => p.id === record.patientId);
        return {
          id: record.id,
          patientName: patient?.name || 'Paciente desconhecido',
          specialty: record.specialty || 'Consulta médica',
          doctor: record.doctor || 'Médico não informado',
          date: record.date,
          time: record.time || '00:00',
          location: record.address || record.clinicHospital || 'Local não informado',
          isFromMedicalRecord: true
        };
      })
  ].filter(apt => {
    // Filtrar apenas consultas futuras
    try {
      let dateStr = apt.date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const appointmentDate = new Date(`${dateStr}T${apt.time}:00`);
      return appointmentDate > new Date();
    } catch {
      return true; // Se não conseguir parsear, mostrar mesmo assim
    }
  }).slice(0, 5); // Mostrar apenas as próximas 5

  const { data: recentUpdates = [] } = useQuery<RecentUpdate[]>({
    queryKey: ["/api/recent-updates"],
  });

  const handlePatientClick = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Há poucos minutos";
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return "Ontem";
    return `Há ${Math.floor(diffInHours / 24)} dias`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        patients={patients} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onPatientClick={handlePatientClick}
      />
      
      <div className="lg:ml-64">
        <Header 
          onQuickRegister={() => setShowQuickRegister(true)}
          onPatientRegister={() => setShowPatientRegister(true)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Próximas Consultas */}
            <Card className="rounded-xl shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">📅</span>
                  <h2 className="text-lg font-semibold text-gray-900">Próximas Consultas</h2>
                </div>
                
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-gray-900">{appointment.patientName}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-sm text-blue-600">
                            <span>{appointment.date}</span>
                            <span className="mx-1">às</span>
                            <span>{appointment.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span className="mr-2">📍</span>
                          <span>{appointment.location}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => {
                            try {
                              const eventTitle = `Consulta - ${appointment.patientName}`;
                              const eventDetails = `Especialidade: ${appointment.specialty}\nMédico: ${appointment.doctor}\nLocal: ${appointment.location}`;
                              
                              // Converter formato brasileiro de data para ISO se necessário
                              let dateStr = appointment.date;
                              let timeStr = appointment.time;
                              
                              // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
                              if (dateStr.includes('/')) {
                                const [day, month, year] = dateStr.split('/');
                                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              }
                              
                              // Garantir que o horário está no formato HH:MM
                              if (timeStr && !timeStr.includes(':')) {
                                if (timeStr.length === 4) {
                                  timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
                                }
                              }
                              
                              // Criar data usando formato ISO
                              const startDate = new Date(`${dateStr}T${timeStr}:00`);
                              
                              // Verificar se a data é válida
                              if (isNaN(startDate.getTime())) {
                                console.error('Data inválida:', appointment.date, appointment.time);
                                alert('Erro: Data ou horário da consulta inválidos');
                                return;
                              }
                              
                              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora depois
                              
                              // Formatar para Google Calendar (YYYYMMDDTHHMMSSZ)
                              const formatGoogleDate = (date: Date) => {
                                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                              };
                              
                              const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(appointment.location)}`;
                              
                              window.open(googleCalendarUrl, '_blank');
                            } catch (error) {
                              console.error('Erro ao criar evento no Google Calendar:', error);
                              alert('Erro ao adicionar na agenda. Verifique os dados da consulta.');
                            }
                          }}
                        >
                          📅 Add na Agenda
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma consulta agendada.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() => navigate("/appointments")}
                  >
                    Ver todas as consultas →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pendências */}
            <Card className="rounded-xl shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">⚠️</span>
                  <h2 className="text-lg font-semibold text-gray-900">Pendências</h2>
                </div>
                
                <div className="space-y-4">
                  {allPendingItems.length > 0 ? (
                    allPendingItems
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.priority === 'high' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.priority === 'high' ? 'Alta' : 
                               item.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma pendência encontrada.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                    onClick={() => navigate("/pending-items")}
                  >
                    Ver todas as pendências →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pacientes Cadastrados */}
          <Card className="rounded-xl shadow-sm border border-gray-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                  <h2 className="text-lg font-semibold text-gray-900">Pacientes Cadastrados</h2>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowPatientRegister(true)}
                >
                  ➕ Cadastrar Paciente
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {patients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">{patient.photoUrl}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{patient.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div><span className="font-medium">Tipo:</span> <span>{patient.bloodType || "N/A"}</span></div>
                        <div><span className="font-medium">Dr:</span> <span>{patient.doctor || "N/A"}</span></div>
                        <div><span className="font-medium">Alergias:</span> <span>{patient.allergies?.length || 0}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Atualizações */}
          <Card className="rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-3">📝</span>
                <h2 className="text-lg font-semibold text-gray-900">Últimas Atualizações</h2>
              </div>
              
              <div className="space-y-4">
                {recentUpdates.length > 0 ? (
                  recentUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{update.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{update.patientName}</span> - {update.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{update.createdAt ? formatTimeAgo(update.createdAt) : 'Recente'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma atualização recente.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="link" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver todas as atualizações →
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AdvancedQuickRegisterModal 
        open={showQuickRegister} 
        onOpenChange={setShowQuickRegister}
        patients={patients}
      />
      
      <ImprovedPatientRegisterModal 
        open={showPatientRegister} 
        onOpenChange={setShowPatientRegister}
      />
    </div>
  );
}
