import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Phone, Shield, FileText, Edit } from "lucide-react";
import { useLocation } from "wouter";
import MedicalRecordCard from "@/components/medical-record-card";
import type { Patient, MedicalRecord } from "@shared/schema";
import { useState } from "react";
import EditPatientModal from "@/components/edit-patient-modal";


export default function ImprovedPatientDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);


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

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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


          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{patient.photoUrl}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-lg text-gray-600">
                  {calculateAge(patient.birthDate)} anos • Nascido em {formatDate(patient.birthDate)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowEditModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Paciente
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="personal">📋 Informações Pessoais</TabsTrigger>
            <TabsTrigger value="records">📄 Registros Médicos</TabsTrigger>
            <TabsTrigger value="summary">📊 Resumo</TabsTrigger>
            <TabsTrigger value="timeline">📅 Linha do Tempo</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Informações Básicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo Sanguíneo</label>
                      <p className="text-lg font-medium">{patient.bloodType || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                      <p className="text-lg">{formatDate(patient.birthDate)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Médico Responsável</label>
                    <p className="text-lg">{patient.doctor || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alergias e Restrições</label>
                    <div className="mt-2">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Nenhuma alergia conhecida</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato de Emergência */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Contato de Emergência</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome do Contato</label>
                    <p className="text-lg">{patient.emergencyContactName || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-lg">{patient.emergencyContactPhone || "Não informado"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Plano de Saúde */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Plano de Saúde</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Plano</label>
                      <p className="text-lg">{patient.insurancePlan || "Não informado"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Número da Carteirinha</label>
                      <p className="text-lg font-mono">{patient.insuranceNumber || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Carteirinha do Plano de Saúde</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Frente</label>
                        {patient.insuranceCardFrontUrl ? (
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={patient.insuranceCardFrontUrl} 
                              alt="Carteirinha - Frente"
                              className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(patient.insuranceCardFrontUrl, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-400">
                            <span className="text-xs">Não enviado</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Verso</label>
                        {patient.insuranceCardBackUrl ? (
                          <div className="border rounded-lg overflow-hidden">
                            <img 
                              src={patient.insuranceCardBackUrl} 
                              alt="Carteirinha - Verso"
                              className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(patient.insuranceCardBackUrl, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-400">
                            <span className="text-xs">Não enviado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos RG */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Documento de Identidade (RG)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Frente</label>
                      {patient.idCardFrontUrl ? (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={patient.idCardFrontUrl} 
                            alt="RG - Frente"
                            className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(patient.idCardFrontUrl, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-400">
                          <span className="text-xs">Não enviado</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Verso</label>
                      {patient.idCardBackUrl ? (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={patient.idCardBackUrl} 
                            alt="RG - Verso"
                            className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(patient.idCardBackUrl, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg h-24 flex items-center justify-center text-gray-400">
                          <span className="text-xs">Não enviado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo dos Registros */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo dos Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
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
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="exam">📋 Exames</TabsTrigger>
                <TabsTrigger value="medication">💊 Medicações</TabsTrigger>
                <TabsTrigger value="appointment">📅 Consultas</TabsTrigger>
                <TabsTrigger value="history">📝 Histórico</TabsTrigger>
                <TabsTrigger value="incident">⚠️ Incidentes</TabsTrigger>
                <TabsTrigger value="pending">📋 Pendências</TabsTrigger>
                <TabsTrigger value="credential">🔑 Senhas</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
                        <MedicalRecordCard key={record.id} record={record} />
                      ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
                      <p className="text-gray-500">Este paciente ainda não possui registros médicos.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {Object.entries(recordsByType).map(([type, records]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {records.length > 0 ? (
                    <div className="space-y-4">
                      {records
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record) => (
                          <MedicalRecordCard key={record.id} record={record} />
                        ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
                        <p className="text-gray-500">Este paciente não possui registros deste tipo.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(recordsByType).map(([type, records]) => {
                const typeLabels = {
                  exam: { label: 'Exames', icon: '📋', color: 'blue' },
                  medication: { label: 'Medicações', icon: '💊', color: 'green' },
                  appointment: { label: 'Consultas', icon: '📅', color: 'purple' },
                  history: { label: 'Histórico', icon: '📝', color: 'yellow' },
                  incident: { label: 'Incidentes', icon: '⚠️', color: 'red' },
                  pending: { label: 'Pendências', icon: '📋', color: 'orange' },
                };

                const typeInfo = typeLabels[type as keyof typeof typeLabels];
                if (!typeInfo) return null;

                return (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{records.length}</div>
                      <div className="space-y-2">
                        {records.slice(0, 3).map((record) => (
                          <div key={record.id} className="text-sm text-gray-600 truncate">
                            {record.title || record.description}
                          </div>
                        ))}
                        {records.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{records.length - 3} mais
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Linha do Tempo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <div className="space-y-4">
                    {medicalRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record, index) => (
                        <div key={record.id} className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm">
                                {record.type === 'exam' ? '📋' :
                                 record.type === 'medication' ? '💊' :
                                 record.type === 'appointment' ? '📅' :
                                 record.type === 'history' ? '📝' :
                                 record.type === 'incident' ? '⚠️' :
                                 record.type === 'credential' ? '🔑' : '📋'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {record.title || record.description}
                              </h4>
                              <span className="text-xs text-gray-500">{record.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {record.type === 'exam' ? 'Exame' :
                               record.type === 'medication' ? 'Medicação' :
                               record.type === 'appointment' ? 'Consulta' :
                               record.type === 'history' ? 'Histórico' :
                               record.type === 'incident' ? 'Incidente' :
                               record.type === 'credential' ? 'Senha' : 'Pendência'}
                            </p>
                          </div>
                          {index < medicalRecords.length - 1 && (
                            <div className="absolute left-5 mt-10 w-px h-4 bg-gray-200"></div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro na linha do tempo</h3>
                    <p className="text-gray-500">Os registros médicos aparecerão aqui conforme forem adicionados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <EditPatientModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        patient={patient}
      />
    </div>
  );
}