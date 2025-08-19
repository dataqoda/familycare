import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Patient, MedicalRecord } from "@shared/schema";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, navigate] = useLocation();

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: medicalRecords = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/medical-records"],
  });

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.doctor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.bloodType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.allergies?.some(allergy => allergy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRecords = medicalRecords.filter(record => {
    const patient = patients.find(p => p.id === record.patientId);
    return (
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Busca</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar pacientes, registros médicos, médicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg py-3"
            />
          </div>
        </div>

        {searchTerm.trim() === "" ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Digite para buscar</h3>
            <p className="text-gray-500">Busque por pacientes, registros médicos, médicos, tipos sanguíneos ou alergias</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Resultados de Pacientes */}
            {filteredPatients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pacientes Encontrados ({filteredPatients.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                      <div 
                        key={patient.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/patient/${patient.id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">{patient.photoUrl}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} anos
                            </p>
                            <p className="text-xs text-gray-500">{patient.bloodType} | {patient.doctor}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resultados de Registros Médicos */}
            {filteredRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Registros Médicos Encontrados ({filteredRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredRecords.map((record) => {
                      const patient = patients.find(p => p.id === record.patientId);
                      return (
                        <div 
                          key={record.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/patient/${record.patientId}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">
                                  {record.type === 'exam' ? '📋' :
                                   record.type === 'medication' ? '💊' :
                                   record.type === 'appointment' ? '📅' :
                                   record.type === 'history' ? '📝' :
                                   record.type === 'incident' ? '⚠️' :
                                   record.type === 'credential' ? '🔑' : '📋'}
                                </span>
                                <span className="text-sm font-medium text-gray-500 capitalize">
                                  {record.type === 'exam' ? 'Exame' :
                                   record.type === 'medication' ? 'Medicação' :
                                   record.type === 'appointment' ? 'Consulta' :
                                   record.type === 'history' ? 'Histórico' :
                                   record.type === 'incident' ? 'Incidente' :
                                   record.type === 'credential' ? 'Senha' : 'Pendência'}
                                </span>
                                <span className="text-sm text-gray-500">{record.date}</span>
                              </div>
                              <h4 className="font-medium text-gray-900">{patient?.name}</h4>
                              <p className="text-gray-700">{record.title || record.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nenhum resultado */}
            {filteredPatients.length === 0 && filteredRecords.length === 0 && searchTerm.trim() !== "" && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
                <p className="text-gray-500">Tente buscar por outros termos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}