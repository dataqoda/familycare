import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient, InsertMedicalRecord } from "@shared/schema";

interface AdvancedQuickRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
}

export default function AdvancedQuickRegisterModal({ open, onOpenChange, patients = [] }: AdvancedQuickRegisterModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState<any>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRecordMutation = useMutation({
    mutationFn: async (data: InsertMedicalRecord) => {
      const response = await apiRequest("POST", "/api/medical-records", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-updates"] });
      toast({
        title: "Registro criado",
        description: "O registro médico foi criado com sucesso.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o registro.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedPatient("");
    setSelectedType("");
    setFormData({});
    setAttachments([]);
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!selectedPatient || !selectedType) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um paciente e um tipo.",
        variant: "destructive",
      });
      return;
    }

    const baseData = {
      patientId: selectedPatient,
      type: selectedType,
      date: formData.date || new Date().toISOString().split('T')[0],
      attachments: attachments,
    };

    createRecordMutation.mutate({ ...baseData, ...formData });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setAttachments(prev => [...prev, ...fileNames]);

      // Simular o upload salvando os nomes dos arquivos
      // Em um ambiente real, você faria o upload real aqui
      toast({
        title: "Arquivo(s) adicionado(s)",
        description: `${fileNames.length} arquivo(s) foram adicionados.`,
      });
    }
  };

  const typeOptions = [
    { value: "exam", label: "📋 Exame" },
    { value: "medication", label: "💊 Medicação" },
    { value: "appointment", label: "📅 Consulta" },
    { value: "history", label: "📝 Histórico" },
    { value: "incident", label: "⚠️ Incidente" },
    { value: "pending", label: "📋 Pendência" },
    { value: "credential", label: "🔑 Senha" },
  ];

  const renderSpecificFields = () => {
    switch (selectedType) {
      case "exam":
        return (
          <div className="space-y-4">
            <div>
              <Label>Tipo de Exame *</Label>
              <Input
                value={formData.examType || ""}
                onChange={(e) => updateFormData("examType", e.target.value)}
                placeholder="Ex: Hemograma, Raio-X..."
              />
            </div>
            <div>
              <Label>Data do Exame *</Label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => updateFormData("date", e.target.value)}
              />
            </div>
            <div>
              <Label>Médico Solicitante</Label>
              <Input
                value={formData.requestingDoctor || ""}
                onChange={(e) => updateFormData("requestingDoctor", e.target.value)}
                placeholder="Dr. Nome do médico"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observations || ""}
                onChange={(e) => updateFormData("observations", e.target.value)}
                placeholder="Observações sobre o exame..."
                rows={3}
              />
            </div>
            <div>
              <Label>Arquivos do Exame</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="text-sm"
                onChange={handleFileUpload}
              />
              {attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Arquivos selecionados:</p>
                  <ul className="text-sm text-gray-700">
                    {attachments.map((file, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span>📎</span>
                        <span>{file}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 ml-auto"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case "medication":
        return (
          <div className="space-y-4">
            <div>
              <Label>Nome do Remédio *</Label>
              <Input
                value={formData.medicationName || ""}
                onChange={(e) => updateFormData("medicationName", e.target.value)}
                placeholder="Nome comercial do medicamento"
              />
            </div>
            <div>
              <Label>Frequência/Horário *</Label>
              <Input
                value={formData.frequency || ""}
                onChange={(e) => updateFormData("frequency", e.target.value)}
                placeholder="Ex: 1x ao dia às 8h"
              />
            </div>
            <div>
              <Label>Tipo de Uso</Label>
              <Select value={formData.usageType || ""} onValueChange={(value) => updateFormData("usageType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Contínuo</SelectItem>
                  <SelectItem value="temporary">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período do Dia</Label>
              <Select value={formData.periodOfDay || ""} onValueChange={(value) => updateFormData("periodOfDay", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="evening">Noite</SelectItem>
                  <SelectItem value="dawn">Madrugada</SelectItem>
                  <SelectItem value="any">Qualquer Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => updateFormData("startDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Tomar por quanto tempo</Label>
              <Input
                value={formData.duration || ""}
                onChange={(e) => updateFormData("duration", e.target.value)}
                placeholder="Ex: 1 semana, 1 mês, 10 dias"
              />
            </div>
            <div>
              <Label>Médico Prescritor</Label>
              <Input
                value={formData.prescribingDoctor || ""}
                onChange={(e) => updateFormData("prescribingDoctor", e.target.value)}
                placeholder="Dr. Nome do médico"
              />
            </div>
            <div>
              <Label>Indicação</Label>
              <Textarea
                value={formData.indication || ""}
                onChange={(e) => updateFormData("indication", e.target.value)}
                placeholder="Porque tomar e para que?"
                rows={3}
              />
            </div>
          </div>
        );

      case "appointment":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm sm:text-base">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => updateFormData("date", e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm sm:text-base">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) => updateFormData("time", e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            <div>
              <Label>Nome da Clínica ou Hospital</Label>
              <Input
                value={formData.clinicHospital || ""}
                onChange={(e) => updateFormData("clinicHospital", e.target.value)}
                placeholder="Nome do local"
              />
            </div>
            <div>
              <Label>Médico</Label>
              <Input
                value={formData.doctor || ""}
                onChange={(e) => updateFormData("doctor", e.target.value)}
                placeholder="Dr. Nome do médico"
              />
            </div>
            <div>
              <Label>Especialidade</Label>
              <Input
                value={formData.specialty || ""}
                onChange={(e) => updateFormData("specialty", e.target.value)}
                placeholder="Cardiologia, Pediatria..."
              />
            </div>
            <div>
              <Label>Endereço/Local</Label>
              <Input
                value={formData.address || ""}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Endereço completo ou link do Google Maps"
              />
            </div>
            <div>
              <Label>Link do Mapa (Google Maps)</Label>
              <Input
                value={formData.mapUrl || ""}
                onChange={(e) => updateFormData("mapUrl", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Título do registro histórico"
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => updateFormData("date", e.target.value)}
              />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Descrição de coisas que já aconteceram ou coisas sabidas..."
                rows={4}
              />
            </div>
          </div>
        );

      case "incident":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título do Incidente *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Ex: Queda de Bicicleta"
              />
            </div>
            <div>
              <Label>Data do Ocorrido *</Label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => updateFormData("date", e.target.value)}
              />
            </div>
            <div>
              <Label>Descrição do Ocorrido *</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={4}
              />
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="space-y-4">
            <div>
              <Label>Título da Pendência *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Ex: Marcar Cardiologista, Marcar Exame de Colonoscopia"
              />
            </div>
            <div>
              <Label>Médico Solicitante</Label>
              <Input
                value={formData.requestingDoctor || ""}
                onChange={(e) => updateFormData("requestingDoctor", e.target.value)}
                placeholder="Dr. Nome do médico"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Observações sobre a pendência..."
                rows={3}
              />
            </div>
            <div>
              <Label>Data do Pedido</Label>
              <Input
                type="date"
                value={formData.date || ""}
                onChange={(e) => updateFormData("date", e.target.value)}
              />
            </div>
            <div>
              <Label>Prazo</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-deadline"
                    checked={formData.deadline === "none"}
                    onCheckedChange={(checked) => updateFormData("deadline", checked ? "none" : "")}
                  />
                  <Label htmlFor="no-deadline">Não há prazo</Label>
                </div>
                {formData.deadline !== "none" && (
                  <Input
                    type="date"
                    value={formData.deadline || ""}
                    onChange={(e) => updateFormData("deadline", e.target.value)}
                    placeholder="Data de expiração"
                  />
                )}
              </div>
            </div>
            <div>
              <Label>Anexar Pedido</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="text-sm"
              />
            </div>
          </div>
        );

      case "credential":
        return (
          <div className="space-y-4">
            <div>
              <Label>Nome do Serviço *</Label>
              <Input
                value={formData.serviceName || ""}
                onChange={(e) => updateFormData("serviceName", e.target.value)}
                placeholder="Ex: Portal Unimed"
              />
            </div>
            <div>
              <Label>URL do Site</Label>
              <Input
                value={formData.serviceUrl || ""}
                onChange={(e) => updateFormData("serviceUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Usuário *</Label>
              <Input
                value={formData.username || ""}
                onChange={(e) => updateFormData("username", e.target.value)}
                placeholder="Nome de usuário ou email"
              />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input
                type="password"
                value={formData.password || ""}
                onChange={(e) => updateFormData("password", e.target.value)}
                placeholder="Senha"
              />
            </div>
            <div>
              <Label>Notas Adicionais</Label>
              <Textarea
                value={formData.additionalNotes || ""}
                onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                placeholder="Informações extras..."
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Selecione um tipo para ver os campos específicos
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">⚡ Registro Rápido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Patient */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">1. Selecionar Familiar</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um familiar..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.photoUrl} {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">2. Escolher Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedType === option.value ? "default" : "outline"}
                  className={`p-2 text-sm justify-start ${
                    selectedType === option.value ? 'bg-purple-600 hover:bg-purple-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedType(option.value);
                    setFormData({});
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Step 3: Specific Fields */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">3. Preencher Detalhes</Label>
            {renderSpecificFields()}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleSave}
            disabled={createRecordMutation.isPending}
          >
            {createRecordMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}