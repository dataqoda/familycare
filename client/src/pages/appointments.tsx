
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, User } from "lucide-react";
import { useLocation } from "wouter";
import type { Appointment } from "@shared/schema";

export default function AppointmentsPage() {
  const [, navigate] = useLocation();

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">Todas as Consultas</h1>
          <p className="text-gray-600 mt-2">Visualize todas as consultas agendadas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{appointment.doctor}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{appointment.date} às {appointment.time}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{appointment.location}</span>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Especialidade</div>
                    <div className="text-sm text-blue-700">{appointment.specialty}</div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        const eventTitle = `Consulta - ${appointment.patientName}`;
                        const eventDetails = `Especialidade: ${appointment.specialty}\nMédico: ${appointment.doctor}\nLocal: ${appointment.location}`;
                        const startDate = new Date(`${appointment.date}T${appointment.time}`);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora depois
                        
                        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(eventDetails)}`;
                        
                        window.open(googleCalendarUrl, '_blank');
                      }}
                    >
                      📅 Google Agenda
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/patient/${appointment.patientId}`)}
                    >
                      Ver Paciente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma consulta encontrada</h3>
                  <p className="text-gray-500">Não há consultas agendadas no momento.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
