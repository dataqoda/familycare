
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

  const { data: medicalRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  // Combinar consultas das duas fontes
  const allAppointments = [
    ...appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
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
          patientId: record.patientId,
          patientName: patient?.name || 'Paciente desconhecido',
          specialty: record.specialty || 'Consulta médica',
          doctor: record.doctor || 'Médico não informado',
          date: record.date,
          time: record.time || '00:00',
          location: record.clinicHospital || '',
          isFromMedicalRecord: true
        };
      })
  ];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {allAppointments.length > 0 ? (
            allAppointments.map((appointment) => (
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
                        try {
                          const eventTitle = `Consulta - ${appointment.patientName}`;
                          const eventDetails = `Especialidade: ${appointment.specialty}\nMédico: ${appointment.doctor}\nLocal: ${appointment.location}`;
                          
                          // Converter formato brasileiro de data para ISO
                          let dateStr = appointment.date;
                          let timeStr = appointment.time;
                          
                          // Se a data está no formato DD/MM/YYYY, converter para YYYY-MM-DD
                          if (dateStr.includes('/')) {
                            const [day, month, year] = dateStr.split('/');
                            dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                          }
                          
                          // Garantir que o horário está no formato HH:MM
                          if (timeStr && !timeStr.includes(':')) {
                            // Se está no formato HHMM, converter para HH:MM
                            if (timeStr.length === 4) {
                              timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
                            }
                          }
                          
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
