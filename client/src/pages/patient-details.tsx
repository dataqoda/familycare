import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Patient, MedicalRecord } from "@shared/schema";

export default function PatientDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: patient } = useQuery<Patient>({
    queryKey: ["/api/patients", id],
    enabled: !!id,
  });

  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
    select: (data) => data.filter(record => record.patientId === id),
    enabled: !!id,
  });

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Paciente não encontrado</h1>
              <Button onClick={() => navigate("/")}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recordsByType = medicalRecords.reduce((acc, record) => {
    if (!acc[record.type]) acc[record.type] = [];
    acc[record.type].push(record);
    return acc;
  }, {} as Record<string, MedicalRecord[]>);

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
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">{patient.avatar}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-lg text-gray-600">{patient.age} anos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo Sanguíneo</label>
                <p className="text-lg">{patient.bloodType || "Não informado"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Médico Responsável</label>
                <p className="text-lg">{patient.doctor || "Não informado"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Alergias</label>
                <div className="space-y-1">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, index) => (
                      <span key={index} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Nenhuma alergia conhecida</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumo dos Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {recordsByType.exam?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">📋 Exames</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {recordsByType.medication?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">💊 Medicações</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {recordsByType.appointment?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">📅 Consultas</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {recordsByType.history?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">📝 Histórico</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {recordsByType.incident?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">⚠️ Incidentes</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {recordsByType.pending?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">📋 Pendências</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros Médicos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="exam">Exames</TabsTrigger>
                <TabsTrigger value="medication">Medicações</TabsTrigger>
                <TabsTrigger value="appointment">Consultas</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="incident">Incidentes</TabsTrigger>
                <TabsTrigger value="pending">Pendências</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {medicalRecords.length > 0 ? (
                    medicalRecords
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((record) => (
                        <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">
                                  {record.type === 'exam' ? '📋' :
                                   record.type === 'medication' ? '💊' :
                                   record.type === 'appointment' ? '📅' :
                                   record.type === 'history' ? '📝' :
                                   record.type === 'incident' ? '⚠️' : '📋'}
                                </span>
                                <span className="text-sm font-medium text-gray-500 capitalize">
                                  {record.type === 'exam' ? 'Exame' :
                                   record.type === 'medication' ? 'Medicação' :
                                   record.type === 'appointment' ? 'Consulta' :
                                   record.type === 'history' ? 'Histórico' :
                                   record.type === 'incident' ? 'Incidente' : 'Pendência'}
                                </span>
                                <span className="text-sm text-gray-500">{record.date}</span>
                              </div>
                              <p className="text-gray-900">{record.description}</p>
                              {record.attachments && record.attachments.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm text-gray-500">Anexos: {record.attachments.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhum registro médico encontrado.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {['exam', 'medication', 'appointment', 'history', 'incident', 'pending'].map((type) => (
                <TabsContent key={type} value={type} className="mt-6">
                  <div className="space-y-4">
                    {recordsByType[type]?.length > 0 ? (
                      recordsByType[type]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((record) => (
                          <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm text-gray-500">{record.date}</span>
                                </div>
                                <p className="text-gray-900">{record.description}</p>
                                {record.attachments && record.attachments.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-sm text-gray-500">Anexos: {record.attachments.length}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Nenhum registro de {
                            type === 'exam' ? 'exame' :
                            type === 'medication' ? 'medicação' :
                            type === 'appointment' ? 'consulta' :
                            type === 'history' ? 'histórico' :
                            type === 'incident' ? 'incidente' : 'pendência'
                          } encontrado.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
