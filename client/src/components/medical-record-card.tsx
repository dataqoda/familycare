import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Calendar, User, MapPin, Clock, FileText, Image, Paperclip, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MedicalRecord } from "@shared/schema";

interface MedicalRecordCardProps {
  record: MedicalRecord;
}

export default function MedicalRecordCard({ record }: MedicalRecordCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().includes(ext));
  };

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
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
      <Card className="w-full">
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
              <div className="mt-4">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Anexos ({record.attachments.length})
                </div>

                {/* Grid de imagens */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {record.attachments
                    .filter(attachment => isImageFile(attachment))
                    .map((attachment, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                             onClick={() => setSelectedImage(attachment)}>
                          {attachment.includes('uploads/') || attachment.includes('http') ? (
                            <img 
                              src={attachment.startsWith('/') ? attachment : `/uploads/${attachment}`}
                              alt={attachment}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                // Fallback se a imagem não carregar
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-center p-4 hidden">
                            <div>
                              <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500 break-all">{attachment}</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                          <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Lista de outros arquivos */}
                <div className="space-y-2">
                  {record.attachments
                    .filter(attachment => !isImageFile(attachment))
                    .map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(attachment)}
                          <span className="text-sm text-gray-700">{attachment}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar imagem */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Visualizar Anexo</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <strong>Arquivo:</strong> {selectedImage}
            </div>
            <div className="w-full max-h-96 bg-gray-100 rounded-lg border overflow-hidden">
              {selectedImage && (selectedImage.includes('uploads/') || selectedImage.includes('http')) ? (
                <img 
                  src={selectedImage.startsWith('/') ? selectedImage : `/uploads/${selectedImage}`}
                  alt={selectedImage}
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="w-full h-96 flex items-center justify-center text-center text-gray-500 hidden">
                <div>
                  <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Imagem não disponível</p>
                  <p className="text-sm">Arquivo: {selectedImage}</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Arquivo não encontrado ou formato não suportado
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSelectedImage(null)}>
                Fechar
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}