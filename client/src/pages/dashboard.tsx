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
    // Filtrar apenas consultas futuras ou recentes (últimos 30 dias para teste)
    try {
      let dateStr = apt.date;

      // Converter formato brasileiro DD/MM/YYYY para YYYY-MM-DD se necessário
      if (dateStr.includes('/')) {
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      // Converter formato YYYY-MM-DD para objeto Date
      const appointmentDate = new Date(`${dateStr}T${apt.time || '00:00'}:00`);
      const now = new Date();

      // Mostrar consultas futuras e dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      return appointmentDate >= sevenDaysAgo;
    } catch (error) {
      console.log('Erro ao processar data da consulta:', apt.date, error);
      return true; // Se não conseguir parsear, mostrar mesmo assim
    }
  })
  .sort((a, b) => {
    // Ordenar por data (mais próximas primeiro)
    try {
      let dateA = a.date;
      let dateB = b.date;

      if (dateA.includes('/')) {
        const [day, month, year] = dateA.split('/');
        dateA = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      if (dateB.includes('/')) {
        const [day, month, year] = dateB.split('/');
        dateB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const dateObjA = new Date(`${dateA}T${a.time || '00:00'}:00`);
      const dateObjB = new Date(`${dateB}T${b.time || '00:00'}:00`);

      return dateObjA.getTime() - dateObjB.getTime();
    } catch {
      return 0;
    }
  })
  .slice(0, 5); // Mostrar apenas as próximas 5

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

        <main className="max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="relative text-center mb-12 sm:mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-blue-100/50 to-green-100/50 rounded-3xl blur-3xl opacity-60 -z-10 transform scale-110"></div>
            <div className="relative bg-gradient-to-br from-white/80 via-purple-50/50 to-blue-50/50 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-purple-100/30 shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform duration-300">
                <span className="text-3xl sm:text-4xl">👋</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-700 via-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
                Bem-vindo ao seu Prontuário
              </h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
                Mantenha toda a informação médica da sua família organizada e sempre à mão
              </p>
            </div>
          </div>

          {/* Próximas Consultas */}
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  Próximas Consultas
                </h2>
              </div>
              {upcomingAppointments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/appointments")}
                  className="text-xs sm:text-sm"
                >
                  Ver todas
                </Button>
              )}
            </div>

            {upcomingAppointments.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma consulta agendada
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-sm mx-auto">
                    Comece organizando suas consultas médicas em um só lugar
                  </p>
                  <Button
                    onClick={() => setShowQuickRegister(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Primeira Consulta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map((appointment) => (
                  <Card
                    key={`${appointment.patientName}-${appointment.date}-${appointment.time}`}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white hover:scale-105"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-purple-100">
                          <AvatarImage
                            src={patients.find(p => p.id === appointment.patientId)?.avatar}
                            alt={appointment.patientName}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm sm:text-base font-semibold">
                            {appointment.patientName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {appointment.patientName}
                          </h3>
                          <p className="text-gray-500 text-xs sm:text-sm truncate">
                            Dr. {appointment.doctor}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Calendar className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Clock className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium">{appointment.time}</span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <MapPin className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{appointment.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Pendências */}
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                  Pendências
                </h2>
              </div>
              {allPendingItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/pending-items")}
                  className="text-xs sm:text-sm"
                >
                  Ver todas
                </Button>
              )}
            </div>

            {allPendingItems.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Tudo em dia! 🎉
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Não há pendências médicas no momento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {allPendingItems.slice(0, 5).map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-white"
                    onClick={() => setSelectedPendingItem(item)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              item.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : item.priority === 'medium' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.priority === 'high' ? '🔴 Alta' :
                               item.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Pacientes Cadastrados */}
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl">👨‍👩‍👧‍👦</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  Pacientes Cadastrados
                </h2>
              </div>
              <Button
                onClick={() => setShowPatientRegister(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Paciente
              </Button>
            </div>

            {patients.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Nenhum paciente cadastrado
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-sm mx-auto">
                    Comece cadastrando os membros da sua família para organizar o histórico médico
                  </p>
                  <Button
                    onClick={() => setShowPatientRegister(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Paciente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {patients.map((patient) => (
                  <Card
                    key={patient.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white hover:scale-105"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center mb-4">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 ring-2 ring-purple-100">
                          <AvatarImage src={patient.photoUrl} alt={patient.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-lg sm:text-xl font-semibold">
                            {patient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">
                          {patient.name}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Calendar className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <User className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {patient.doctor || 'Médico não informado'}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                          <Droplet className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {patient.bloodType || "Tipo sanguíneo não informado"}
                          </span>
                        </div>
                        {patient.allergies && patient.allergies.length > 0 && (
                          <div className="flex items-center text-red-600 bg-red-50 rounded-lg p-2">
                            <AlertTriangle className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              {patient.allergies.length} alergia{patient.allergies.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Últimas Atualizações */}
          <Card className="relative overflow-hidden rounded-3xl shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-blue-100/20"></div>
            <CardContent className="relative p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl">📝</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                  Últimas Atualizações
                </h2>
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
                <Button 
                  variant="link" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => navigate("/recent-updates")}
                >
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
        patients={patients || []}
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