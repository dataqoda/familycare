import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Phone, Shield, FileText, Edit, User, MapPin, Clock, Droplet, AlertTriangle, Plus } from "lucide-react";
import { useLocation } from "wouter";
import MedicalRecordCard from "@/components/medical-record-card";
import type { Patient, MedicalRecord } from "@shared/schema";
import { useState } from "react";
import EditPatientModal from "@/components/edit-patient-modal";
import QuickRegisterModal from "@/components/quick-register-modal";


export default function ImprovedPatientDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);


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

          {/* Header do Paciente - Modernizado e Responsivo */}
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white via-white to-purple-50/50 overflow-hidden">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative mx-auto sm:mx-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-purple-100">
                      <span className="text-2xl sm:text-4xl text-white font-bold">{patient.photoUrl}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{patient.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                      <p className="text-lg sm:text-xl text-gray-600">
                        {calculateAge(patient.birthDate)} anos
                      </p>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <p className="text-sm sm:text-lg text-gray-500">
                        Nascido em {formatDate(patient.birthDate)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-3">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-3 py-1 text-xs sm:text-sm justify-center sm:justify-start">
                        <Droplet className="w-3 h-3 mr-1" />
                        {patient.bloodType || "Tipo não informado"}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1 text-xs sm:text-sm justify-center sm:justify-start">
                        <User className="w-3 h-3 mr-1" />
                        {patient.doctor || "Médico não informado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowEditPatient(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Paciente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="space-y-8">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-lg p-1 sm:p-2 rounded-xl gap-1 sm:gap-0">
            <TabsTrigger value="personal" className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3">
              <span className="hidden sm:inline">📋 Informações Pessoais</span>
              <span className="sm:hidden">📋 Pessoais</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3">
              <span className="hidden sm:inline">📄 Registros Médicos</span>
              <span className="sm:hidden">📄 Registros</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3">
              <span className="hidden sm:inline">📊 Resumo</span>
              <span className="sm:hidden">📊 Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-lg font-medium text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3">
              <span className="hidden sm:inline">📅 Linha do Tempo</span>
              <span className="sm:hidden">📅 Timeline</span>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Carteirinha */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700 text-sm sm:text-base">Carteirinha do Plano de Saúde</h5>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Frente</label>
                            {patient.insuranceCardFrontUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.insuranceCardFrontUrl} 
                                  alt="Carteirinha - Frente"
                                  className="w-full h-24 sm:h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.insuranceCardFrontUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-24 sm:h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center px-2">Não enviado</span>
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
                                  className="w-full h-24 sm:h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.insuranceCardBackUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-24 sm:h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center px-2">Não enviado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Documento de Identidade */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700 text-sm sm:text-base">Documento de Identidade (RG)</h5>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-2 font-medium">Frente</label>
                            {patient.idCardFrontUrl ? (
                              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
                                <img 
                                  src={patient.idCardFrontUrl} 
                                  alt="RG - Frente"
                                  className="w-full h-24 sm:h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.idCardFrontUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-24 sm:h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center px-2">Não enviado</span>
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
                                  className="w-full h-24 sm:h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                  onClick={() => window.open(patient.idCardBackUrl, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl h-24 sm:h-32 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                <span className="text-xs text-center px-2">Não enviado</span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                        {recordsByType.exam?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">📋 Exames</span>
                        <span className="sm:hidden">📋</span>
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                        {recordsByType.medication?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">💊 Medicações</span>
                        <span className="sm:hidden">💊</span>
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                        {recordsByType.appointment?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">📅 Consultas</span>
                        <span className="sm:hidden">📅</span>
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
                        {recordsByType.history?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">📝 Histórico</span>
                        <span className="sm:hidden">📝</span>
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mb-1 sm:mb-2">
                        {recordsByType.incident?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">⚠️ Incidentes</span>
                        <span className="sm:hidden">⚠️</span>
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">
                        {recordsByType.pending?.length || 0}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">
                        <span className="hidden sm:inline">📋 Pendências</span>
                        <span className="sm:hidden">📋</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-md rounded-xl p-1 sm:p-2 flex flex-wrap justify-center sm:justify-start gap-1 h-auto min-h-[40px]">
                <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">Todos</span>
                  <span className="sm:hidden">📋 Todos</span>
                </TabsTrigger>
                <TabsTrigger value="exam" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">📋 Exames</span>
                  <span className="sm:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger value="medication" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">💊 Medicações</span>
                  <span className="sm:hidden">💊</span>
                </TabsTrigger>
                <TabsTrigger value="appointment" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">📅 Consultas</span>
                  <span className="sm:hidden">📅</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">📝 Histórico</span>
                  <span className="sm:hidden">📝</span>
                </TabsTrigger>
                <TabsTrigger value="incident" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">⚠️ Incidentes</span>
                  <span className="sm:hidden">⚠️</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">📋 Pendências</span>
                  <span className="sm:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger value="credential" className="rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-shrink-0">
                  <span className="hidden sm:inline">🔑 Senhas</span>
                  <span className="sm:hidden">🔑</span>
                </TabsTrigger>
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

              {['exam', 'medication', 'appointment', 'history', 'incident', 'pending', 'credential'].map((type) => {
                const records = recordsByType[type] || [];
                const typeConfig = {
                  exam: { 
                    icon: '📋', 
                    title: 'Nenhum exame registrado', 
                    description: 'Os exames médicos aparecerão aqui quando forem adicionados.',
                    buttonText: 'Adicionar Primeiro Exame'
                  },
                  medication: { 
                    icon: '💊', 
                    title: 'Nenhuma medicação registrada', 
                    description: 'As medicações e prescrições aparecerão aqui quando forem adicionadas.',
                    buttonText: 'Adicionar Primeira Medicação'
                  },
                  appointment: { 
                    icon: '📅', 
                    title: 'Nenhuma consulta registrada', 
                    description: 'As consultas médicas aparecerão aqui quando forem agendadas.',
                    buttonText: 'Agendar Primeira Consulta'
                  },
                  history: { 
                    icon: '📝', 
                    title: 'Nenhum histórico registrado', 
                    description: 'O histórico médico aparecerá aqui quando for adicionado.',
                    buttonText: 'Adicionar Primeiro Histórico'
                  },
                  incident: { 
                    icon: '⚠️', 
                    title: 'Nenhum incidente registrado', 
                    description: 'Os incidentes médicos aparecerão aqui quando forem registrados.',
                    buttonText: 'Registrar Primeiro Incidente'
                  },
                  pending: { 
                    icon: '📋', 
                    title: 'Nenhuma pendência registrada', 
                    description: 'As pendências médicas aparecerão aqui quando forem criadas.',
                    buttonText: 'Criar Primeira Pendência'
                  },
                  credential: { 
                    icon: '🔑', 
                    title: 'Nenhuma senha registrada', 
                    description: 'As senhas e credenciais aparecerão aqui quando forem salvas.',
                    buttonText: 'Salvar Primeira Senha'
                  }
                };

                const config = typeConfig[type as keyof typeof typeConfig];
                if (!config) return null;

                return (
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
                          <p className="text-gray-500">Este paciente ainda não possui registros médicos deste tipo.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                );
              })}
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

      {/* Modals */}
      <QuickRegisterModal
        open={showQuickRegister}
        onOpenChange={setShowQuickRegister}
        patients={patient ? [patient] : []}
      />

      <EditPatientModal
        open={showEditPatient}
        onOpenChange={setShowEditPatient}
        patient={patient}
      />
    </div>
  );
}