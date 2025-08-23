
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, FileText, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import type { RecentUpdate, Patient } from "@shared/schema";

export default function RecentUpdatesPage() {
  const [, navigate] = useLocation();

  const { data: recentUpdates = [] } = useQuery<RecentUpdate[]>({
    queryKey: ["/api/recent-updates"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Há poucos minutos";
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return "Ontem";
    return `Há ${Math.floor(diffInHours / 24)} dias`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medical':
        return <FileText className="w-5 h-5 text-green-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 border-l-blue-400';
      case 'pending':
        return 'bg-orange-50 border-l-orange-400';
      case 'medical':
        return 'bg-green-50 border-l-green-400';
      default:
        return 'bg-gray-50 border-l-gray-400';
    }
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
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                Todas as Atualizações
              </h1>
              <p className="text-gray-600 mt-1">Histórico completo de atividades do sistema</p>
            </div>
          </div>
        </div>

        {recentUpdates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atualização encontrada
              </h3>
              <p className="text-gray-500">
                Quando houver atividade no sistema, as atualizações aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentUpdates.map((update) => {
              const patient = patients.find(p => p.id === update.patientId);
              
              return (
                <Card 
                  key={update.id} 
                  className={`transition-all duration-200 hover:shadow-lg border-l-4 ${getBackgroundColor(update.type)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                        {getIcon(update.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {update.patientName}
                            </h3>
                            <p className="text-gray-700 mb-3">
                              {update.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {update.createdAt ? 
                                    new Date(update.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 
                                    'Data não disponível'
                                  }
                                </span>
                              </div>
                              
                              <span className="text-gray-400">•</span>
                              
                              <span>
                                {update.createdAt ? formatTimeAgo(new Date(update.createdAt)) : 'Recente'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 ml-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              update.type === 'appointment' ? 'bg-blue-100 text-blue-800' :
                              update.type === 'pending' ? 'bg-orange-100 text-orange-800' :
                              update.type === 'medical' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {update.type === 'appointment' ? 'Consulta' :
                               update.type === 'pending' ? 'Pendência' :
                               update.type === 'medical' ? 'Médico' : 'Outros'}
                            </span>
                          </div>
                        </div>
                        
                        {patient && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/patient/${patient.id}`)}
                              className="text-sm"
                            >
                              <User className="w-4 h-4 mr-2" />
                              Ver Paciente
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {recentUpdates.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Mostrando {recentUpdates.length} atualização{recentUpdates.length !== 1 ? 'ões' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
