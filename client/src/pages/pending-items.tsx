
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { PendingItem } from "@shared/schema";

export default function PendingItemsPage() {
  const [, navigate] = useLocation();

  const { data: pendingItems = [] } = useQuery<PendingItem[]>({
    queryKey: ["/api/pending-items"],
  });

  const { data: medicalRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-records"],
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients"],
  });

  // Combinar pendências das duas fontes
  const allPendingItems = [
    ...pendingItems.map(item => {
      const patient = patients.find(p => p.id === item.patientId);
      return {
        id: item.id,
        patientId: item.patientId,
        patientName: patient?.name || 'Paciente desconhecido',
        title: item.title,
        description: item.description,
        priority: item.priority,
        completed: item.completed,
        createdAt: item.createdAt,
        isFromMedicalRecord: false
      };
    }),
    ...medicalRecords
      .filter(record => record.type === 'pending')
      .map(record => {
        const patient = patients.find(p => p.id === record.patientId);
        return {
          id: record.id,
          patientId: record.patientId,
          patientName: patient?.name || 'Paciente desconhecido',
          title: record.title || record.description || 'Pendência',
          description: record.description,
          priority: 'medium' as const,
          completed: false,
          createdAt: record.createdAt,
          isFromMedicalRecord: true
        };
      })
  ];

  const incompletePendingItems = allPendingItems.filter(item => !item.completed);
  const completedPendingItems = allPendingItems.filter(item => item.completed);

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
          
          <h1 className="text-3xl font-bold text-gray-900">Todas as Pendências</h1>
          <p className="text-gray-600 mt-2">Visualize e gerencie todas as pendências médicas</p>
        </div>

        {/* Pendências em Aberto */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Pendências em Aberto ({incompletePendingItems.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incompletePendingItems.length > 0 ? (
              incompletePendingItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-blue-600 font-medium">{item.patientName}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority === 'high' ? 'Alta Prioridade' : 
                         item.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/patient/${item.patientId}`)}
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
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pendência em aberto</h3>
                    <p className="text-gray-500">Parabéns! Todas as pendências foram resolvidas.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Pendências Concluídas */}
        {completedPendingItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Pendências Concluídas ({completedPendingItems.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedPendingItems.map((item) => (
                <Card key={item.id} className="opacity-75 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-700">{item.title}</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">{item.patientName}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        ✓ Concluída
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/patient/${item.patientId}`)}
                      >
                        Ver Paciente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
