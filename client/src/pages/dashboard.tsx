import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import AdvancedQuickRegisterModal from "@/components/advanced-quick-register-modal";
import ImprovedPatientRegisterModal from "@/components/improved-patient-register-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Users, Calendar, AlertTriangle, FileText, User, MapPin, Clock, Droplet, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import type { Patient, Appointment, PendingItem, RecentUpdate, MedicalRecord } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to format date (assuming it's needed for upcomingAppointments)
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    let date = new Date(dateString);
    // Adjust for timezone issues if dateString is only date
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/');
      date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`); // Use noon to avoid DST issues
    }
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if parsing fails
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string on error
  }
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showPatientRegister, setShowPatientRegister] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedPendingItem, setSelectedPendingItem] = useState<any>(null);
  const [showAddPatient, setShowAddPatient] = useState(false); // Added state for "Adicionar Paciente"

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
      isFromMedicalRecord: false,
      createdAt: item.createdAt // Assuming createdAt exists
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
          isFromMedicalRecord: true,
          createdAt: record.createdAt // Assuming createdAt exists
        };
      })
  ].filter(item => !item.completed);

  // Combinar consultas das duas fontes e filtrar apenas futuras
  const upcomingAppointments = [
    ...appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patientName,
      specialty: apt.specialty,
      doctor: apt.doctor,
      date: apt.date,
      time: apt.time,
      location: apt.location,
      mapUrl: apt.mapUrl,
      isFromMedicalRecord: false
    })),
    ...medicalRecords
      .filter(record => record.type === 'appointment')
      .map(record => {
        const patient = patients.find(p => p.id === record.patientId);
        return {
          id: record.id,
          patientId: record.patientId,
          patientName: patient?.name || 'Paciente desconhecido',
          specialty: record.specialty || 'Consulta médica',
          doctor: record.doctor || 'Médico não informado',
          date: record.date,
          time: record.time || '00:00',
          location: record.clinicHospital || 'Local não informado',
          mapUrl: record.mapUrl,
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

        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center px-4">
            <Button
              onClick={() => setShowAddPatient(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Paciente
            </Button>
            <Button
              onClick={() => setShowQuickRegister(true)}
              className="bg-secondary hover:bg-secondary/90 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              <FileText className="w-4 h-4 mr-2" />
              Registro Rápido
            </Button>
          </div>

          {/* Próximas Consultas */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 text-center px-4">
              Próximas Consultas
            </h2>
            {upcomingAppointments.length === 0 ? (
              <Card className="p-6 sm:p-8 text-center mx-4">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Nenhuma consulta agendada</p>
                <Button
                  onClick={() => setShowQuickRegister(true)}
                  className="bg-primary hover:bg-primary/90 text-white text-sm sm:text-base px-4 sm:px-6"
                >
                  Agendar Consulta
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4">
                {upcomingAppointments.map((appointment) => (
                  <Card
                    key={`${appointment.patientName}-${appointment.date}-${appointment.time}`}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarImage
                            src={patients.find(p => p.id === appointment.patientId)?.avatar}
                            alt={appointment.patientName}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                            {appointment.patientName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-xs sm:text-sm truncate">{appointment.patientName}</h3>
                          <p className="text-gray-600 text-xs truncate">Dr. {appointment.doctor}</p>
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{appointment.time}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm truncate">{appointment.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pendências */}
          <Card className="rounded-xl shadow-sm border border-gray-200 mx-4 mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-4 sm:mb-4">
                <span className="text-xl sm:text-2xl mr-3">⚠️</span>
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
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{item.description}</p>
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

          {/* Pacientes Cadastrados */}
          <Card className="rounded-xl shadow-sm border border-gray-200 mx-4 mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-3">👨‍👩‍👧‍👦</span>
                  <h2 className="text-lg font-semibold text-gray-900">Pacientes Cadastrados</h2>
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto mt-3 sm:mt-0 text-sm sm:text-base"
                  onClick={() => setShowPatientRegister(true)}
                >
                  ➕ Cadastrar Paciente
                </Button>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {patients.map((patient) => (
                  <Card
                    key={patient.id}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <CardHeader className="text-center pb-3 sm:pb-4">
                      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
                        <AvatarImage src={patient.photoUrl} alt={patient.name} />
                        <AvatarFallback className="text-sm sm:text-lg font-semibold bg-primary/10 text-primary">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
                        {patient.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-1 sm:space-y-2 px-3 sm:px-6">
                      <div className="flex items-center justify-center text-gray-600">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">{new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos</span>
                      </div>
                      <div className="flex items-center justify-center text-gray-600">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm truncate max-w-full">{patient.doctor || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-center text-gray-600">
                        <Droplet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">{patient.bloodType || "N/A"}</span>
                      </div>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="flex items-center justify-center text-red-600">
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">Alergias</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Atualizações */}
          <Card className="rounded-xl shadow-sm border border-gray-200 mx-4">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl mr-3">📝</span>
                <h2 className="text-lg font-semibold text-gray-900">Últimas Atualizações</h2>
              </div>

              <div className="space-y-4">
                {recentUpdates.length > 0 ? (
                  recentUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        update.type === 'appointment' ? 'bg-blue-100' :
                        update.type === 'pending' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        {update.icon ? (
                          <span className="text-sm">{update.icon}</span>
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{update.patientName}</span> - {update.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{update.createdAt ? formatTimeAgo(new Date(update.createdAt)) : 'Recente'}</p>
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

      {/* Modal de Detalhes da Consulta */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes da Consulta</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarImage src={patients.find(p => p.id === selectedAppointment.patientId)?.avatar} alt={selectedAppointment.patientName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm sm:text-base">
                    {selectedAppointment.patientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg truncate">{selectedAppointment.patientName}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">Dr. {selectedAppointment.doctor}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{formatDate(selectedAppointment.date)}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{selectedAppointment.time}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base break-words">{selectedAppointment.location}</span>
                </div>
              </div>

              {(selectedAppointment.location || selectedAppointment.mapUrl) && (
                <div className="mb-6">
                  <Button
                    onClick={() => {
                      if (selectedAppointment.mapUrl) {
                        window.open(selectedAppointment.mapUrl, '_blank');
                      } else if (selectedAppointment.location) {
                        const encodedLocation = encodeURIComponent(selectedAppointment.location);
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
                        window.open(mapsUrl, '_blank');
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-2 sm:py-3"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
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
                  }}
                >
                  📅 Adicionar à Agenda
                </Button>
                <Button
                  onClick={() => {
                    const patientId = selectedAppointment.patientId || patients.find(p => p.name === selectedAppointment.patientName)?.id;
                    if (patientId) {
                      setSelectedAppointment(null);
                      navigate(`/patient/${patientId}`);
                    } else {
                      alert('Paciente não encontrado');
                    }
                  }}
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
                  onClick={() => {
                    if (selectedPendingItem.patientId) {
                      setSelectedPendingItem(null);
                      navigate(`/patient/${selectedPendingItem.patientId}`);
                    } else {
                      alert('Paciente não encontrado');
                    }
                  }}
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