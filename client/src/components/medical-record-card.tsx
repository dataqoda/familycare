import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Calendar, User, MapPin, Clock, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MedicalRecord } from "@shared/schema";

interface MedicalRecordCardProps {
  record: MedicalRecord;
}

export default function MedicalRecordCard({ record }: MedicalRecordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/medical-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-updates"] });
      toast({
        title: "Registro excluído",
        description: "O registro médico foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o registro.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      deleteRecordMutation.mutate(record.id);
    }
  };

  const getTypeIcon = () => {
    switch (record.type) {
      case 'exam': return '📋';
      case 'medication': return '💊';
      case 'appointment': return '📅';
      case 'history': return '📝';
      case 'incident': return '⚠️';
      case 'pending': return '📋';
      case 'credential': return '🔑';
      default: return '📄';
    }
  };

  const getTypeLabel = () => {
    switch (record.type) {
      case 'exam': return 'Exame';
      case 'medication': return 'Medicação';
      case 'appointment': return 'Consulta';
      case 'history': return 'Histórico';
      case 'incident': return 'Incidente';
      case 'pending': return 'Pendência';
      case 'credential': return 'Senha';
      default: return 'Registro';
    }
  };

  const getTypeColor = () => {
    switch (record.type) {
      case 'exam': return 'bg-blue-100 text-blue-800';
      case 'medication': return 'bg-green-100 text-green-800';
      case 'appointment': return 'bg-purple-100 text-purple-800';
      case 'history': return 'bg-yellow-100 text-yellow-800';
      case 'incident': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'credential': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRecordSpecificContent = () => {
    
    switch (record.type) {
      case 'exam':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Tipo de Exame</span>
                <p className="text-sm">{record.examType || 'Não especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Médico Solicitante</span>
                <p className="text-sm">{record.requestingDoctor || 'Não informado'}</p>
              </div>
            </div>
            {record.observations && (
              <div>
                <span className="text-sm font-medium text-gray-500">Observações</span>
                <p className="text-sm">{record.observations}</p>
              </div>
            )}
          </div>
        );

      case 'medication':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Medicamento</span>
                <p className="text-sm font-medium">{record.medicationName || 'Não especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Frequência</span>
                <p className="text-sm">{record.frequency || 'Não informado'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Tipo de Uso</span>
                <p className="text-sm">{record.usageType === 'continuous' ? 'Contínuo' : record.usageType === 'temporary' ? 'Temporário' : 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Duração</span>
                <p className="text-sm">{record.duration || 'Não informado'}</p>
              </div>
            </div>
            {record.indication && (
              <div>
                <span className="text-sm font-medium text-gray-500">Indicação</span>
                <p className="text-sm">{record.indication}</p>
              </div>
            )}
          </div>
        );

      case 'appointment':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Data e Hora</span>
                  <p className="text-sm">{record.date} {record.time && `às ${record.time}`}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Médico</span>
                  <p className="text-sm">{record.doctor || 'Não informado'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Local</span>
                <p className="text-sm">{record.clinicHospital || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Especialidade</span>
                <p className="text-sm">{record.specialty || 'Não informado'}</p>
              </div>
            </div>
            {record.address && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Endereço</span>
                  <p className="text-sm">{record.address}</p>
                  {record.mapUrl && (
                    <a href={record.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                      Ver no mapa
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Médico Solicitante</span>
                <p className="text-sm">{record.requestingDoctor || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Prazo</span>
                <p className="text-sm">
                  {record.deadline === 'none' ? 'Sem prazo' : record.deadline || 'Não informado'}
                </p>
              </div>
            </div>
            {record.description && (
              <div>
                <span className="text-sm font-medium text-gray-500">Observações</span>
                <p className="text-sm">{record.description}</p>
              </div>
            )}
          </div>
        );

      case 'credential':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Serviço</span>
                <p className="text-sm font-medium">{record.serviceName || 'Não especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Usuário</span>
                <p className="text-sm">{record.username || 'Não informado'}</p>
              </div>
            </div>
            {record.serviceUrl && (
              <div>
                <span className="text-sm font-medium text-gray-500">URL</span>
                <a href={record.serviceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline block">
                  {record.serviceUrl}
                </a>
              </div>
            )}
            {record.additionalNotes && (
              <div>
                <span className="text-sm font-medium text-gray-500">Notas</span>
                <p className="text-sm">{record.additionalNotes}</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div>
            {record.description && (
              <div>
                <span className="text-sm font-medium text-gray-500">Descrição</span>
                <p className="text-sm">{record.description}</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon()}</span>
              <div>
                <CardTitle className="text-lg">{record.title || record.description}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className={getTypeColor()}>
                    {getTypeLabel()}
                  </Badge>
                  <span className="text-xs text-gray-500">{record.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de edição em breve." })}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteRecordMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 line-clamp-2">
            {record.description || record.medicationName || record.examType || 'Sem descrição'}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">{getTypeIcon()}</span>
              <span>{record.title || record.description}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge className={getTypeColor()}>
                {getTypeLabel()}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{record.date}</span>
              </div>
            </div>
            
            {renderRecordSpecificContent()}
            
            {record.attachments && record.attachments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500 mb-2 block">Anexos</span>
                <div className="space-y-2">
                  {record.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}