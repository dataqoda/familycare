import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Phone, Shield, FileText, Edit, User, MapPin, Clock, Droplet, AlertTriangle, Plus, Lock } from "lucide-react";
import { useLocation } from "wouter";
import MedicalRecordCard from "@/components/medical-record-card";
import type { Patient, MedicalRecord } from "@shared/schema";
import { useState, useCallback } from "react";
import EditPatientModal from "@/components/edit-patient-modal";
import QuickRegisterModal from "@/components/quick-register-modal";
import PasswordPromptModal from "@/components/password-prompt-modal";


export default function ImprovedPatientDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [activeRecordTab, setActiveRecordTab] = useState("all");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [filter, setFilter] = useState('all'); // State for filtering medical records


  const { data: patient } = useQuery<Patient>({
    queryKey: ["/api/patients", id],
    enabled: !!id,
  });

  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
    select: (data) => data.filter(record => record.patientId === id),
    enabled: !!id,
  });

  const sensitiveRecordTypes = ["exam", "history", "credential"];

  const isSensitiveRecordType = useCallback((type: string) => {
    return sensitiveRecordTypes.includes(type);
  }, []);

  const requestSensitiveAccess = () => {
    if (!patient?.sensitiveDataPasswordActive) {
      setIsAuthenticated(true);
      return;
    }
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === patient?.sensitiveDataPassword) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
    } else {
      alert("Senha incorreta!");
    }
  };

  const filteredMedicalRecords = medicalRecords.filter(record => {
    if (patient?.sensitiveDataPasswordActive && isSensitiveRecordType(record.type) && !isAuthenticated) {
      return false;
    }
    return true;
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

  const allRecordsByType = {
    ...recordsByType,
    credential: recordsByType.credential || [],
    exam: recordsByType.exam || [],
    history: recordsByType.history || [],
  };


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
          {/* Header com informações do paciente */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-xl p-6 mb-8 border border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-blue-100">
                    {patient?.photoUrl || "👤"}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">{patient?.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="bg-blue-100 px-2 py-1 rounded-full">🎂 {calculateAge(patient.birthDate)} anos</span>
                      {patient?.bloodType && (
                        <span className="bg-red-100 px-2 py-1 rounded-full flex items-center space-x-1">
                          <Droplet className="w-4 h-4 text-red-500" />
                          <span>{patient.bloodType}</span>
                        </span>
                      )}
                      {patient?.doctor && (
                        <span className="bg-green-100 px-2 py-1 rounded-full">👨‍⚕️ {patient.doctor}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowEditPatient(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  ✏️ Editar
                </Button>
                <Button
                  onClick={() => setShowQuickRegister(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ➕ Novo Registro
                </Button>
              </div>
            </div>

            {/* Alergias */}
            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-xl shadow-sm">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-red-800">⚠️ Alergias conhecidas:</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} className="text-xs bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-semibold">
                          ⚠️ {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-8" value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs de navegação */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl shadow-inner">
              <Button
                variant={activeTab === 'personal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300 font-medium border-2 ${
                  activeTab === 'personal'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg border-purple-600 hover:from-purple-700 hover:to-purple-800 transform scale-105'
                    : 'bg-white text-gray-600 border-transparent hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 hover:shadow-sm'
                }`}
              >
                <span className="text-base">👤</span>
                <span>Informações Pessoais</span>
              </Button>

              <Button
                variant={activeTab === 'records' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300 font-medium border-2 ${
                  activeTab === 'records'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg border-green-600 hover:from-green-700 hover:to-green-800 transform scale-105'
                    : 'bg-white text-gray-600 border-transparent hover:bg-green-50 hover:text-green-700 hover:border-green-200 hover:shadow-sm'
                }`}
              >
                <span className="text-base">🗂️</span>
                <span>Registros Médicos</span>
              </Button>

              <Button
                variant={activeTab === 'summary' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300 font-medium border-2 ${
                  activeTab === 'summary'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-blue-600 hover:from-blue-700 hover:to-blue-800 transform scale-105'
                    : 'bg-white text-gray-600 border-transparent hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <span className="text-base">📊</span>
                <span>Resumo</span>
              </Button>

              <Button
                variant={activeTab === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300 font-medium border-2 ${
                  activeTab === 'timeline'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg border-orange-600 hover:from-orange-700 hover:to-orange-800 transform scale-105'
                    : 'bg-white text-gray-600 border-transparent hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 hover:shadow-sm'
                }`}
              >
                <span className="text-base">⏰</span>
                <span>Linha do Tempo</span>
              </Button>
            </div>
          </div>

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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div 
                      className="text-center p-4 bg-blue-50 rounded-lg relative cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("exam");
                      }}
                    >
                      <div className="text-2xl font-bold text-blue-600">
                        {allRecordsByType.exam?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                        <span>📋 Exames</span>
                        {patient?.sensitiveDataPasswordActive && (
                          <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                            {isAuthenticated ? '🔓' : '🔒'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="text-center p-4 bg-green-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("medication");
                      }}
                    >
                      <div className="text-2xl font-bold text-green-600">
                        {recordsByType.medication?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">💊 Medicações</div>
                    </div>
                    <div 
                      className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("appointment");
                      }}
                    >
                      <div className="text-2xl font-bold text-purple-600">
                        {recordsByType.appointment?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">📅 Consultas</div>
                    </div>
                    <div 
                      className="text-center p-4 bg-yellow-50 rounded-lg relative cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("history");
                      }}
                    >
                      <div className="text-2xl font-bold text-yellow-600">
                        {allRecordsByType.history?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                        <span>📝 Histórico</span>
                        {patient?.sensitiveDataPasswordActive && (
                          <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                            {isAuthenticated ? '🔓' : '🔒'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="text-center p-4 bg-red-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("incident");
                      }}
                    >
                      <div className="text-2xl font-bold text-red-600">
                        {recordsByType.incident?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">⚠️ Incidentes</div>
                    </div>
                    <div 
                      className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer"
                      onClick={() => {
                        setActiveTab("records");
                        setActiveRecordTab("pending");
                      }}
                    >
                      <div className="text-2xl font-bold text-orange-600">
                        {recordsByType.pending?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">📋 Pendências</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg relative cursor-pointer">
                      <div className="text-2xl font-bold text-indigo-600">
                        {allRecordsByType.credential?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                        <span>🔑 Senhas</span>
                        {patient?.sensitiveDataPasswordActive && (
                          <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                            {isAuthenticated ? '🔓' : '🔒'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Tabs value={activeRecordTab} onValueChange={setActiveRecordTab} className="space-y-6">
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl justify-center">
                <button
                  onClick={() => setActiveRecordTab('all')}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeRecordTab === 'all'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-300 ring-2 ring-gray-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <span>📋</span>
                  <span>Todos</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSensitiveRecordType('exam') && patient?.sensitiveDataPasswordActive && !isAuthenticated) {
                      requestSensitiveAccess();
                    } else {
                      setActiveRecordTab('exam');
                    }
                  }}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 relative ${
                    activeRecordTab === 'exam'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-300 ring-2 ring-blue-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <span>📋</span>
                  <span>Exames</span>
                  {patient?.sensitiveDataPasswordActive && isSensitiveRecordType('exam') && (
                    <span className={`text-xs ${activeRecordTab === 'exam' ? 'text-white' : (isAuthenticated ? 'text-green-600' : 'text-red-500')}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveRecordTab('medication')}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeRecordTab === 'medication'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-300 ring-2 ring-green-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 hover:shadow-md'
                  }`}
                >
                  <span>💊</span>
                  <span>Medicações</span>
                </button>

                <button
                  onClick={() => setActiveRecordTab('appointment')}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeRecordTab === 'appointment'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-300 ring-2 ring-purple-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 hover:shadow-md'
                  }`}
                >
                  <span>📅</span>
                  <span>Consultas</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSensitiveRecordType('history') && patient?.sensitiveDataPasswordActive && !isAuthenticated) {
                      requestSensitiveAccess();
                    } else {
                      setActiveRecordTab('history');
                    }
                  }}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 relative ${
                    activeRecordTab === 'history'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-300 ring-2 ring-yellow-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 hover:shadow-md'
                  }`}
                >
                  <span>📝</span>
                  <span>Histórico</span>
                  {patient?.sensitiveDataPasswordActive && isSensitiveRecordType('history') && (
                    <span className={`text-xs ${activeRecordTab === 'history' ? 'text-white' : (isAuthenticated ? 'text-green-600' : 'text-red-500')}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveRecordTab('incident')}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeRecordTab === 'incident'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-300 ring-2 ring-red-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 hover:shadow-md'
                  }`}
                >
                  <span>⚠️</span>
                  <span>Incidentes</span>
                </button>

                <button
                  onClick={() => setActiveRecordTab('pending')}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeRecordTab === 'pending'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-300 ring-2 ring-orange-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  <span>📋</span>
                  <span>Pendências</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSensitiveRecordType('credential') && patient?.sensitiveDataPasswordActive && !isAuthenticated) {
                      requestSensitiveAccess();
                    } else {
                      setActiveRecordTab('credential');
                    }
                  }}
                  className={`flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 relative ${
                    activeRecordTab === 'credential'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-300 ring-2 ring-indigo-300'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <span>🔑</span>
                  <span>Senha</span>
                  {patient?.sensitiveDataPasswordActive && isSensitiveRecordType('credential') && (
                    <span className={`text-xs ${activeRecordTab === 'credential' ? 'text-white' : (isAuthenticated ? 'text-green-600' : 'text-red-500')}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </button>
              </div>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-6">
                  {patient?.sensitiveDataPasswordActive && !isAuthenticated && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          <strong>Alguns dados estão protegidos:</strong> Exames, Histórico e Senhas estão ocultos. 
                          <button 
                            onClick={requestSensitiveAccess}
                            className="ml-2 text-amber-900 underline hover:no-underline"
                          >
                            Clique aqui para inserir a senha
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                  {filteredMedicalRecords.length > 0 ? (
                    <div className="space-y-6">
                      {filteredMedicalRecords
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
                </div>
              </TabsContent>

              {['exam', 'medication', 'appointment', 'history', 'incident', 'pending', 'credential'].map((type) => {
                const records = recordsByType[type] || [];

                return (
                  <TabsContent key={type} value={type} className="mt-6">
                    <div className="space-y-4">
                      {/* Verificar se o tipo é sensível e se está protegido */}
                      {isSensitiveRecordType(type) && patient?.sensitiveDataPasswordActive && !isAuthenticated ? (
                        <div className="text-center py-12">
                          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Dados Protegidos</h3>
                          <p className="text-gray-500 mb-4">
                            Este conteúdo está protegido por senha.
                          </p>
                          <Button onClick={requestSensitiveAccess} variant="outline">
                            <Lock className="w-4 h-4 mr-2" />
                            Inserir Senha
                          </Button>
                        </div>
                      ) : records.length > 0 ? (
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
                            <p className="text-gray-500">Este paciente ainda não possui nenhum registro deste tipo.</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="text-center p-4 bg-blue-50 rounded-lg relative cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("exam");
                }}
              >
                <div className="text-2xl font-bold text-blue-600">
                  {allRecordsByType.exam?.length || 0}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                  <span>📋 Exames</span>
                  {patient?.sensitiveDataPasswordActive && (
                    <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </div>
              </div>
              <div 
                className="text-center p-4 bg-green-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("medication");
                }}
              >
                <div className="text-2xl font-bold text-green-600">
                  {recordsByType.medication?.length || 0}
                </div>
                <div className="text-sm text-gray-600">💊 Medicações</div>
              </div>
              <div 
                className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("appointment");
                }}
              >
                <div className="text-2xl font-bold text-purple-600">
                  {recordsByType.appointment?.length || 0}
                </div>
                <div className="text-sm text-gray-600">📅 Consultas</div>
              </div>
              <div 
                className="text-center p-4 bg-yellow-50 rounded-lg relative cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("history");
                }}
              >
                <div className="text-2xl font-bold text-yellow-600">
                  {allRecordsByType.history?.length || 0}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                  <span>📝 Histórico</span>
                  {patient?.sensitiveDataPasswordActive && (
                    <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </div>
              </div>
              <div 
                className="text-center p-4 bg-red-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("incident");
                }}
              >
                <div className="text-2xl font-bold text-red-600">
                  {recordsByType.incident?.length || 0}
                </div>
                <div className="text-sm text-gray-600">⚠️ Incidentes</div>
              </div>
              <div 
                className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setActiveTab("records");
                  setActiveRecordTab("pending");
                }}
              >
                <div className="text-2xl font-bold text-orange-600">
                  {recordsByType.pending?.length || 0}
                </div>
                <div className="text-sm text-gray-600">📋 Pendências</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg relative cursor-pointer">
                <div className="text-2xl font-bold text-indigo-600">
                  {allRecordsByType.credential?.length || 0}
                </div>
                <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                  <span>🔑 Senhas</span>
                  {patient?.sensitiveDataPasswordActive && (
                    <span className={`text-xs ${isAuthenticated ? 'text-green-600' : 'text-red-500'}`}>
                      {isAuthenticated ? '🔓' : '🔒'}
                    </span>
                  )}
                </div>
              </div>
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
                {filteredMedicalRecords.length > 0 ? (
                  <div className="space-y-6">
                    {filteredMedicalRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record, index) => {
                        const isSensitive = isSensitiveRecordType(record.type);
                        if (isSensitive && patient?.sensitiveDataPasswordActive && !isAuthenticated) {
                          return (
                            <div key={record.id} className="flex items-start space-x-6 relative bg-gray-100 p-4 rounded-lg shadow-sm">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center shadow-lg">
                                  <Shield className="w-6 h-6 text-gray-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-base font-semibold text-gray-900">Conteúdo Protegido</h4>
                                </div>
                                <p className="text-sm text-gray-600">Este registro está protegido por senha.</p>
                              </div>
                              {index < filteredMedicalRecords.length - 1 && (
                                <div className="absolute left-6 mt-12 w-px h-6 bg-gradient-to-b from-blue-200 to-transparent"></div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={record.id} className="flex items-start space-x-6 relative">
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg`}>
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
                            {index < filteredMedicalRecords.length - 1 && (
                              <div className="absolute left-6 mt-12 w-px h-6 bg-gradient-to-b from-blue-200 to-transparent"></div>
                            )}
                          </div>
                        );
                      })}
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
      <EditPatientModal 
        open={showEditPatient} 
        onOpenChange={setShowEditPatient}
        patient={patient}
      />

      <QuickRegisterModal 
        open={showQuickRegister} 
        onOpenChange={setShowQuickRegister}
        patients={[patient].filter(Boolean) || []}
        patientId={patient?.id}
      />

      <PasswordPromptModal
        open={showPasswordPrompt}
        onOpenChange={setShowPasswordPrompt}
        onPasswordSubmit={handlePasswordSubmit}
        patientName={patient?.name || ""}
      />
    </div>
  );
}