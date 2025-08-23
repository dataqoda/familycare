import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import AdvancedQuickRegisterModal from "@/components/advanced-quick-register-modal";
import ImprovedPatientRegisterModal from "@/components/improved-patient-register-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Users, Calendar, AlertTriangle, FileText, User, MapPin, Clock } from "lucide-react";
import { useLocation } from "wouter";
import type { Patient, Appointment, PendingItem, RecentUpdate, MedicalRecord } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showPatientRegister, setShowPatientRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedPendingItem, setSelectedPendingItem] = useState<any>(null);

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
                    upcomingAppointments
                      .slice(0, 4)
                      .map((appointment) => (
                        <div 
                          key={appointment.id} 
                          className="p-4 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
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
                        <div 
                          key={item.id} 
                          className="p-4 bg-orange-50 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
                          onClick={() => setSelectedPendingItem(item)}
                        >
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
                              Prioridade {item.priority === 'high' ? 'Alta' : 
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
        isOpen={showQuickRegister}
        onClose={() => setShowQuickRegister(false)}
        onSuccess={() => {
          setShowQuickRegister(false);
          // Refresh data
          window.location.reload();
        }}
      />

      {/* Modal de Detalhes da Consulta */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detalhes da Consulta
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedAppointment.patientName}
                  </h3>
                  <p className="text-gray-600">{selectedAppointment.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Médico</p>
                      <p className="text-gray-900">{selectedAppointment.doctor || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Data</p>
                      <p className="text-gray-900">{selectedAppointment.date}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Horário</p>
                      <p className="text-gray-900">{selectedAppointment.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Local</p>
                      <p className="text-gray-900">{selectedAppointment.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    try {
                      const eventTitle = `Consulta - ${selectedAppointment.patientName}`;
                      const eventDetails = `Especialidade: ${selectedAppointment.specialty}\nMédico: ${selectedAppointment.doctor}\nLocal: ${selectedAppointment.location}`;

                      let dateStr = selectedAppointment.date;
                      let timeStr = selectedAppointment.time;

                      if (dateStr.includes('/')) {
                        const [day, month, year] = dateStr.split('/');
                        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      }

                      if (timeStr && !timeStr.includes(':')) {
                        if (timeStr.length === 4) {
                          timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
                        }
                      }

                      const startDate = new Date(`${dateStr}T${timeStr}:00`);

                      if (isNaN(startDate.getTime())) {
                        console.error('Data inválida:', selectedAppointment.date, selectedAppointment.time);
                        alert('Erro: Data ou horário da consulta inválidos');
                        return;
                      }

                      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

                      const formatGoogleDate = (date: Date) => {
                        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                      };

                      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(selectedAppointment.location)}`;

                      window.open(googleCalendarUrl, '_blank');
                    } catch (error) {
                      console.error('Erro ao criar evento no Google Calendar:', error);
                      alert('Erro ao adicionar na agenda. Verifique os dados da consulta.');
                    }
                  }}
                >
                  📅 Adicionar à Agenda
                </Button>
                <Button 
                  onClick={() => navigate(`/patient/${selectedAppointment.patientId}`)}
                  className="flex-1"
                >
                  Ver Paciente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Pendência */}
      <Dialog open={!!selectedPendingItem} onOpenChange={() => setSelectedPendingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Detalhes da Pendência
            </DialogTitle>
          </DialogHeader>

          {selectedPendingItem && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedPendingItem.priority === 'high' ? 'bg-red-100' :
                  selectedPendingItem.priority === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`w-8 h-8 ${
                    selectedPendingItem.priority === 'high' ? 'text-red-600' :
                    selectedPendingItem.priority === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPendingItem.title}
                  </h3>
                  <p className="text-gray-600">
                    Paciente: {selectedPendingItem.patientName || 'Não informado'}
                  </p>
                </div>
              </div>

              {selectedPendingItem.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Descrição</h4>
                  <p className="text-gray-900">{selectedPendingItem.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Prioridade</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                        selectedPendingItem.priority === 'high' ? 'bg-red-100 text-red-800' :
                        selectedPendingItem.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedPendingItem.priority === 'high' ? 'Alta Prioridade' :
                         selectedPendingItem.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Criado em</p>
                      <p className="text-gray-900">
                        {new Date(selectedPendingItem.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/patient/${selectedPendingItem.patientId}`)}
                >
                  Ver Paciente
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setSelectedPendingItem(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImprovedPatientRegisterModal 
        open={showPatientRegister} 
        onOpenChange={setShowPatientRegister}
      />
    </div>
  );
}