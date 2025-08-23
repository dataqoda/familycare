
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Phone, Shield, FileText, Edit, User, MapPin, Clock, Droplet, AlertTriangle } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Paciente não encontrado</h1>
              <Button 
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-6 shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Header do Paciente - Modernizado */}
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white via-white to-purple-50/50 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-purple-100">
                      <span className="text-4xl text-white font-bold">{patient.photoUrl}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{patient.name}</h1>
                    <div className="flex items-center space-x-4">
                      <p className="text-xl text-gray-600">
                        {calculateAge(patient.birthDate)} anos
                      </p>
                      <span className="text-gray-400">•</span>
                      <p className="text-lg text-gray-500">
                        Nascido em {formatDate(patient.birthDate)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 mt-3">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-3 py-1">
                        <Droplet className="w-3 h-3 mr-1" />
                        {patient.bloodType || "Tipo não informado"}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                        <User className="w-3 h-3 mr-1" />
                        {patient.doctor || "Médico não informado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowEditModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Paciente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-lg p-2 rounded-xl">
            <TabsTrigger value="personal" className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              📋 Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              📄 Registros Médicos
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              📊 Resumo
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-lg font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
              📅 Linha do Tempo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informações Básicas - Modernizado */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span>Informações Básicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Tipo Sanguíneo</label>
                      <p className="text-xl font-semibold text-gray-900">{patient.bloodType || "Não informado"}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Data de Nascimento</label>
                      <p className="text-lg font-medium text-gray-900">{formatDate(patient.birthDate)}</p>
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Médico Responsável</label>
                    <p className="text-lg font-medium text-gray-900">{patient.doctor || "Não informado"}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500 mb-3 block">Alergias e Restrições</label>
                    <div className="mt-2">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="secondary" className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-0 px-3 py-1 shadow-sm">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Nenhuma alergia conhecida</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato de Emergência - Modernizado */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <span>Contato de Emergência</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Nome do Contato</label>
                    <p className="text-lg font-medium text-gray-900">{patient.emergencyContactName || "Não informado"}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Telefone</label>
                    <p className="text-lg font-medium text-gray-900">{patient.emergencyContactPhone || "Não informado"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Plano de Saúde - Modernizado */}
              <Card className="lg:col-span-2 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span>Plano de Saúde</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Plano</label>
                      <p className="text-lg font-medium text-gray-900">{patient.insurancePlan || "Não informado"}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Número da Carteirinha</label>
                      <p className="text-lg font-mono font-medium text-gray-900">{patient.insuranceNumber || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-800 mb-6 text-lg">Documentos do Plano de Saúde</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Carteirinha */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700 text-base">Carteirinha do Plano de Saúde</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Frente</label>
                            {patient.insuranceCardFrontUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.insuranceCardFrontUrl} 
                                  alt="Carteirinha - Frente"
                                  className="w-full h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.insuranceCardFrontUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center">Não enviado</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Verso</label>
                            {patient.insuranceCardBackUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.insuranceCardBackUrl} 
                                  alt="Carteirinha - Verso"
                                  className="w-full h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.insuranceCardBackUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center">Não enviado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Documento de Identidade */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700 text-base">Documento de Identidade (RG)</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Frente</label>
                            {patient.idCardFrontUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.idCardFrontUrl} 
                                  alt="RG - Frente"
                                  className="w-full h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.idCardFrontUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center">Não enviado</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Verso</label>
                            {patient.idCardBackUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.idCardBackUrl} 
                                  alt="RG - Verso"
                                  className="w-full h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.idCardBackUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center">Não enviado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo dos Registros - Modernizado */}
              <Card className="lg:col-span-2 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span>Resumo dos Registros</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {recordsByType.exam?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">📋 Exames</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {recordsByType.medication?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">💊 Medicações</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {recordsByType.appointment?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">📅 Consultas</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">
                        {recordsByType.history?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">📝 Histórico</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {recordsByType.incident?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">⚠️ Incidentes</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {recordsByType.pending?.length || 0}
                      </div>
                      <div className="text-sm text-gray-700 font-medium">📋 Pendências</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-md rounded-xl p-2">
                <TabsTrigger value="all" className="rounded-lg">Todos</TabsTrigger>
                <TabsTrigger value="exam" className="rounded-lg">📋 Exames</TabsTrigger>
                <TabsTrigger value="medication" className="rounded-lg">💊 Medicações</TabsTrigger>
                <TabsTrigger value="appointment" className="rounded-lg">📅 Consultas</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg">📝 Histórico</TabsTrigger>
                <TabsTrigger value="incident" className="rounded-lg">⚠️ Incidentes</TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg">📋 Pendências</TabsTrigger>
                <TabsTrigger value="credential" className="rounded-lg">🔑 Senhas</TabsTrigger>
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
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                    <CardContent className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum registro encontrado</h3>
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
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                      <CardContent className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum registro encontrado</h3>
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
                  <Card key={type} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br from-${typeInfo.color}-500 to-${typeInfo.color}-600 rounded-xl flex items-center justify-center`}>
                          <span className="text-white">{typeInfo.icon}</span>
                        </div>
                        <span>{typeInfo.label}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-4 text-gray-900">{records.length}</div>
                      <div className="space-y-3">
                        {records.slice(0, 3).map((record) => (
                          <div key={record.id} className="text-sm text-gray-600 truncate bg-gray-50 p-3 rounded-lg">
                            {record.title || record.description}
                          </div>
                        ))}
                        {records.length > 3 && (
                          <div className="text-sm text-gray-500 bg-gray-100 p-2 rounded-lg text-center">
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span>Linha do Tempo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecords.length > 0 ? (
                  <div className="space-y-6">
                    {medicalRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record, index) => (
                        <div key={record.id} className="flex items-start space-x-6 relative">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white">
                                {record.type === 'exam' ? '📋' :
                                 record.type === 'medication' ? '💊' :
                                 record.type === 'appointment' ? '📅' :
                                 record.type === 'history' ? '📝' :
                                 record.type === 'incident' ? '⚠️' :
                                 record.type === 'credential' ? '🔑' : '📋'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-semibold text-gray-900">
                                {record.title || record.description}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {record.date}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {record.type === 'exam' ? 'Exame' :
                               record.type === 'medication' ? 'Medicação' :
                               record.type === 'appointment' ? 'Consulta' :
                               record.type === 'history' ? 'Histórico' :
                               record.type === 'incident' ? 'Incidente' :
                               record.type === 'credential' ? 'Senha' : 'Pendência'}
                            </p>
                          </div>
                          {index < medicalRecords.length - 1 && (
                            <div className="absolute left-6 mt-12 w-px h-6 bg-gradient-to-b from-blue-200 to-transparent"></div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum registro na linha do tempo</h3>
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
