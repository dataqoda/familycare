import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import QuickRegisterModal from "@/components/quick-register-modal";
import PatientRegisterModal from "@/components/patient-register-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Patient, Appointment, PendingItem, RecentUpdate } from "@shared/schema";

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

  const { data: pendingItems = [] } = useQuery<PendingItem[]>({
    queryKey: ["/api/pending-items"],
  });

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
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
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
                            // Add to calendar functionality would go here
                            console.log("Add to calendar:", appointment);
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
                  <Button variant="link" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
                  {pendingItems.filter(item => !item.completed).length > 0 ? (
                    pendingItems
                      .filter(item => !item.completed)
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
                  <Button variant="link" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
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
                        <span className="text-2xl">{patient.avatar}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{patient.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{patient.age} anos</p>
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
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(update.createdAt)}</p>
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

      <QuickRegisterModal 
        open={showQuickRegister} 
        onOpenChange={setShowQuickRegister}
        patients={patients}
      />
      
      <PatientRegisterModal 
        open={showPatientRegister} 
        onOpenChange={setShowPatientRegister}
      />
    </div>
  );
}
