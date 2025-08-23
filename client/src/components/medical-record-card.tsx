import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Calendar, User, MapPin, Clock, FileText, Image, Paperclip, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    type: record.type,
    title: record.title,
    description: record.description,
    date: record.date,
    attachments: record.attachments || []
  });

  // Debug: verificar anexos
  console.log('Anexos do registro:', record.attachments);

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

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/medical-records/${record.id}`, data);
      if (!response.ok) {
        throw new Error("Failed to update record");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({
        title: "Sucesso!",
        description: "Registro médico atualizado com sucesso.",
      });
      setShowEditModal(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro médico.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      deleteRecordMutation.mutate(record.id);
    }
  };

  const handleEdit = () => {
    const baseData = {
      type: record.type,
      description: record.description,
      date: record.date,
      attachments: record.attachments || []
    };

    // Incluir campos específicos baseado no tipo
    const specificFields = {} as any;

    if (record.type === 'appointment') {
      specificFields.time = (record as any).time;
      specificFields.doctor = (record as any).doctor;
      specificFields.specialty = (record as any).specialty;
      specificFields.clinicHospital = (record as any).clinicHospital;
      specificFields.address = (record as any).address;
      specificFields.mapUrl = (record as any).mapUrl;
    } else if (record.type === 'exam') {
      specificFields.examType = (record as any).examType;
      specificFields.requestingDoctor = (record as any).requestingDoctor;
      specificFields.observations = (record as any).observations;
    } else if (record.type === 'medication') {
      specificFields.medicationName = (record as any).medicationName;
      specificFields.frequency = (record as any).frequency;
      specificFields.usageType = (record as any).usageType;
      specificFields.periodOfDay = (record as any).periodOfDay;
      specificFields.startDate = (record as any).startDate;
      specificFields.duration = (record as any).duration;
      specificFields.prescribingDoctor = (record as any).prescribingDoctor;
      specificFields.indication = (record as any).indication;
    } else if (record.type === 'credential') {
      specificFields.serviceName = (record as any).serviceName;
      specificFields.serviceUrl = (record as any).serviceUrl;
      specificFields.username = (record as any).username;
      specificFields.password = (record as any).password;
      specificFields.additionalNotes = (record as any).additionalNotes;
    } else if (record.type === 'pending') {
      specificFields.requestingDoctor = (record as any).requestingDoctor;
      specificFields.deadline = (record as any).deadline;
    }

    setEditFormData({
      ...baseData,
      ...specificFields
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(editFormData);
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

  const isImageFile = (filename: string): boolean => {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const cleanFilename = filename.split('/').pop() || filename; // Pega apenas o nome do arquivo
    return imageExtensions.some(ext => cleanFilename.toLowerCase().endsWith(ext));
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
            
            {/* Links diretos para download dos anexos */}
            {record.attachments && record.attachments.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700 block mb-2">🔗 Links diretos para download:</span>
                <div className="space-y-1">
                  {record.attachments.map((attachment, index) => {
                    let downloadUrl;
                    if (attachment.startsWith('http')) {
                      downloadUrl = attachment;
                    } else if (attachment.startsWith('/uploads/')) {
                      downloadUrl = `http://localhost:5000${attachment}`;
                    } else if (attachment.includes('/')) {
                      const fileName = attachment.split('/').pop();
                      downloadUrl = `http://localhost:5000/uploads/${fileName}`;
                    } else {
                      downloadUrl = `http://localhost:5000/uploads/${attachment}`;
                    }
                    
                    return (
                      <div key={index} className="text-xs">
                        <a 
                          href={downloadUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {downloadUrl}
                        </a>
                      </div>
                    );
                  })}
                </div>
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
                <CardTitle className="text-lg">
                  {record.type === 'appointment' ? (
                    `Consulta ${(record as any).specialty ? `- ${(record as any).specialty}` : ''}`
                  ) : record.type === 'medication' ? (
                    record.medicationName || 'Medicação'
                  ) : record.type === 'exam' ? (
                    record.examType || 'Exame'
                  ) : record.type === 'credential' ? (
                    (record as any).serviceName || 'Credencial'
                  ) : (
                    record.title || record.description || 'Registro'
                  )}
                </CardTitle>
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
                onClick={handleEdit}
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
            {record.type === 'appointment' ? (
              `Dr. ${(record as any).doctor || 'Não informado'} - ${(record as any).specialty || 'Especialidade não informada'}`
            ) : record.type === 'medication' ? (
              record.medicationName || 'Medicação não especificada'
            ) : record.type === 'exam' ? (
              record.examType || 'Tipo de exame não especificado'
            ) : record.type === 'credential' ? (
              (record as any).serviceName || 'Serviço não especificado'
            ) : record.type === 'pending' ? (
              record.description || 'Pendência sem descrição'
            ) : (
              record.description || 'Sem descrição'
            )}
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
                    .map((attachment, index) => {
                      // Construir URL correta - usar diretamente o attachment se já for um caminho completo
                      let imageUrl;
                      if (attachment.startsWith('http')) {
                        imageUrl = attachment;
                      } else if (attachment.startsWith('/uploads/')) {
                        imageUrl = `http://localhost:5000${attachment}`;
                      } else if (attachment.includes('/')) {
                        // Se contém barra mas não é caminho completo, pegar só o nome do arquivo
                        const fileName = attachment.split('/').pop();
                        imageUrl = `http://localhost:5000/uploads/${fileName}`;
                      } else {
                        // É apenas o nome do arquivo
                        imageUrl = `http://localhost:5000/uploads/${attachment}`;
                      }
                      
                      console.log('Renderizando imagem:', {
                        attachment,
                        imageUrl,
                        recordId: record.id
                      });
                      
                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                               onClick={() => setSelectedImage(attachment)}>
                            <img 
                              src={imageUrl}
                              alt={`Anexo ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onLoad={(e) => {
                                console.log('✅ Imagem carregada com sucesso:', {
                                  attachment,
                                  imageUrl,
                                  dimensions: `${(e.target as HTMLImageElement).naturalWidth}x${(e.target as HTMLImageElement).naturalHeight}`
                                });
                              }}
                              onError={(e) => {
                                console.error('❌ Erro ao carregar imagem:', {
                                  attachment,
                                  imageUrl,
                                  recordId: record.id
                                });
                                // Mostrar fallback
                                const target = e.target as HTMLImageElement;
                                const container = target.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-red-50 border-2 border-red-200">
                                      <div class="text-center p-2">
                                        <div class="text-red-400 mb-1">📷</div>
                                        <p class="text-xs text-red-600">Erro ao carregar</p>
                                        <p class="text-xs text-gray-500 break-all">${attachment}</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                            <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Lista de outros arquivos */}
                <div className="space-y-2">
                  {record.attachments
                    .filter(attachment => !isImageFile(attachment))
                    .map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(attachment)}
                          <span className="text-sm text-gray-700">{attachment.split('/').pop() || attachment}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            let fileUrl;
                            if (attachment.startsWith('http')) {
                              fileUrl = attachment;
                            } else if (attachment.startsWith('/uploads/')) {
                              fileUrl = `http://localhost:5000${attachment}`;
                            } else if (attachment.includes('/')) {
                              const fileName = attachment.split('/').pop();
                              fileUrl = `http://localhost:5000/uploads/${fileName}`;
                            } else {
                              fileUrl = `http://localhost:5000/uploads/${attachment}`;
                            }
                            console.log('📥 Baixando arquivo:', { attachment, fileUrl });
                            window.open(fileUrl, '_blank');
                          }}
                        >
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
      {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl max-h-4xl p-4">
              <img 
                src={(() => {
                  if (selectedImage.startsWith('http')) {
                    return selectedImage;
                  } else if (selectedImage.startsWith('/uploads/')) {
                    return `http://localhost:5000${selectedImage}`;
                  } else if (selectedImage.includes('/')) {
                    const fileName = selectedImage.split('/').pop();
                    return `http://localhost:5000/uploads/${fileName}`;
                  } else {
                    return `http://localhost:5000/uploads/${selectedImage}`;
                  }
                })()}
                alt="Visualização ampliada"
                className="max-w-full max-h-full object-contain"
                onLoad={() => {
                  console.log('✅ Modal - Imagem carregada:', selectedImage);
                }}
                onError={(e) => {
                  console.error('❌ Modal - Erro ao carregar imagem:', selectedImage);
                  setSelectedImage(null);
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Registro Médico</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo</Label>
              <Select 
                value={editFormData.type} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">📋 Exame</SelectItem>
                  <SelectItem value="medication">💊 Medicação</SelectItem>
                  <SelectItem value="appointment">📅 Consulta</SelectItem>
                  <SelectItem value="history">📝 Histórico</SelectItem>
                  <SelectItem value="incident">⚠️ Incidente</SelectItem>
                  <SelectItem value="pending">📋 Pendência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do registro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite a descrição do registro..."
                rows={4}
              />
            </div>

            {/* Campos específicos por tipo */}
            {editFormData.type === 'appointment' && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900">Detalhes da Consulta</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Horário</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={(record as any).time || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-doctor">Médico</Label>
                    <Input
                      id="edit-doctor"
                      value={(record as any).doctor || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, doctor: e.target.value }))}
                      placeholder="Nome do médico"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty">Especialidade</Label>
                    <Input
                      id="edit-specialty"
                      value={(record as any).specialty || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, specialty: e.target.value }))}
                      placeholder="Especialidade médica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-clinic">Local</Label>
                    <Input
                      id="edit-clinic"
                      value={(record as any).clinicHospital || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, clinicHospital: e.target.value }))}
                      placeholder="Clínica/Hospital"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Endereço</Label>
                  <Input
                    id="edit-address"
                    value={(record as any).address || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo"
                  />
                </div>
              </div>
            )}

            {editFormData.type === 'exam' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Detalhes do Exame</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-exam-type">Tipo de Exame</Label>
                    <Select 
                      value={(record as any).examType || ''} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, examType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laboratorial">Laboratorial</SelectItem>
                        <SelectItem value="Imagem">Imagem</SelectItem>
                        <SelectItem value="Clínico">Clínico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-requesting-doctor">Médico Solicitante</Label>
                    <Input
                      id="edit-requesting-doctor"
                      value={(record as any).requestingDoctor || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, requestingDoctor: e.target.value }))}
                      placeholder="Nome do médico"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-observations">Observações</Label>
                  <Textarea
                    id="edit-observations"
                    value={(record as any).observations || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Observações do exame"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {editFormData.type === 'medication' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Detalhes da Medicação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-medication-name">Nome do Medicamento</Label>
                    <Input
                      id="edit-medication-name"
                      value={(record as any).medicationName || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, medicationName: e.target.value }))}
                      placeholder="Nome do medicamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-frequency">Frequência</Label>
                    <Input
                      id="edit-frequency"
                      value={(record as any).frequency || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder="Ex: 2x ao dia"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-usage-type">Tipo de Uso</Label>
                    <Select 
                      value={(record as any).usageType || ''} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, usageType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Contínuo</SelectItem>
                        <SelectItem value="temporary">Temporário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Duração</Label>
                    <Input
                      id="edit-duration"
                      value={(record as any).duration || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="Ex: 7 dias"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-indication">Indicação</Label>
                  <Textarea
                    id="edit-indication"
                    value={(record as any).indication || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, indication: e.target.value }))}
                    placeholder="Indicação médica"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {editFormData.type === 'credential' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Detalhes da Credencial</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-service-name">Nome do Serviço</Label>
                    <Input
                      id="edit-service-name"
                      value={(record as any).serviceName || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                      placeholder="Nome do serviço"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-username">Usuário</Label>
                    <Input
                      id="edit-username"
                      value={(record as any).username || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Nome de usuário"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-service-url">URL do Serviço</Label>
                  <Input
                    id="edit-service-url"
                    type="url"
                    value={(record as any).serviceUrl || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, serviceUrl: e.target.value }))}
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-additional-notes">Notas Adicionais</Label>
                  <Textarea
                    id="edit-additional-notes"
                    value={(record as any).additionalNotes || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Notas ou observações"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}