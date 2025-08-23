
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@shared/schema";

interface EditPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export default function EditPatientModal({ open, onOpenChange, patient }: EditPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    bloodType: "",
    doctor: "",
    photoUrl: "👤",
    allergies: [] as string[],
    emergencyContactName: "",
    emergencyContactPhone: "",
    insurancePlan: "",
    insuranceNumber: "",
    observations: "",
    insuranceCardFrontUrl: "",
    insuranceCardBackUrl: "",
    idCardFrontUrl: "",
    idCardBackUrl: "",
    sensitiveDataPasswordActive: false,
    sensitiveDataPassword: "",
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (patient && open) {
      setFormData({
        name: patient.name || "",
        birthDate: patient.birthDate || "",
        bloodType: patient.bloodType || "",
        doctor: patient.doctor || "",
        photoUrl: patient.photoUrl || "👤",
        allergies: patient.allergies || [],
        emergencyContactName: patient.emergencyContactName || "",
        emergencyContactPhone: patient.emergencyContactPhone || "",
        insurancePlan: patient.insurancePlan || "",
        insuranceNumber: patient.insuranceNumber || "",
        observations: patient.observations || "",
        insuranceCardFrontUrl: patient.insuranceCardFrontUrl || "",
        insuranceCardBackUrl: patient.insuranceCardBackUrl || "",
        idCardFrontUrl: patient.idCardFrontUrl || "",
        idCardBackUrl: patient.idCardBackUrl || "",
        sensitiveDataPasswordActive: patient.sensitiveDataPasswordActive || false,
        sensitiveDataPassword: patient.sensitiveDataPassword || "",
      });
    }
  }, [patient, open]);

  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/patients/${patient?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao atualizar paciente");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient?.id] });
      toast({
        title: "Sucesso!",
        description: "Paciente atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o paciente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    updatePatientMutation.mutate(formData);
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }));
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!file) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        [fieldName]: result.path
      }));

      toast({
        title: "Sucesso!",
        description: `${file.name} foi enviado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha no upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const emojiOptions = ["👤", "👨", "👩", "🧒", "👶", "👴", "👵", "🧑‍⚕️", "👨‍⚕️", "👩‍⚕️"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo do paciente"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
              <Select value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo sanguíneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="doctor">Médico Responsável</Label>
              <Input
                id="doctor"
                value={formData.doctor}
                onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
                placeholder="Dr. Nome do médico"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto/Avatar</Label>
            <div className="flex gap-2 flex-wrap">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`w-12 h-12 text-2xl border rounded-lg hover:bg-gray-50 ${
                    formData.photoUrl === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, photoUrl: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Alergias</Label>
            <div className="flex gap-2">
              <Input
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder="Digite uma alergia"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              />
              <Button type="button" onClick={addAllergy} variant="outline">
                Adicionar
              </Button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {formData.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Contato de Emergência</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                placeholder="Nome do contato"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Telefone de Emergência</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurancePlan">Plano de Saúde</Label>
              <Select value={formData.insurancePlan} onValueChange={(value) => setFormData(prev => ({ ...prev, insurancePlan: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amil">Amil</SelectItem>
                  <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                  <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                  <SelectItem value="Unimed">Unimed</SelectItem>
                  <SelectItem value="NotreDame Intermédica">NotreDame Intermédica</SelectItem>
                  <SelectItem value="Hapvida">Hapvida</SelectItem>
                  <SelectItem value="Prevent Senior">Prevent Senior</SelectItem>
                  <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                  <SelectItem value="Golden Cross">Golden Cross</SelectItem>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="SUS">SUS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Número da Carteirinha</Label>
              <Input
                id="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                placeholder="Número da carteirinha"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">📄 Upload de Documentos</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceCardFront">Carteirinha - Frente</Label>
                <Input
                  id="insuranceCardFront"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'insuranceCardFrontUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.insuranceCardFrontUrl || patient?.insuranceCardFrontUrl) && (
                  <p className="text-xs text-green-600">✓ Arquivo atual: carteirinha-frente</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="insuranceCardBack">Carteirinha - Verso</Label>
                <Input
                  id="insuranceCardBack"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'insuranceCardBackUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.insuranceCardBackUrl || patient?.insuranceCardBackUrl) && (
                  <p className="text-xs text-green-600">✓ Arquivo atual: carteirinha-verso</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idCardFront">RG - Frente</Label>
                <Input
                  id="idCardFront"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'idCardFrontUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.idCardFrontUrl || patient?.idCardFrontUrl) && (
                  <p className="text-xs text-green-600">✓ Arquivo atual: rg-frente</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idCardBack">RG - Verso</Label>
                <Input
                  id="idCardBack"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'idCardBackUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.idCardBackUrl || patient?.idCardBackUrl) && (
                  <p className="text-xs text-green-600">✓ Arquivo atual: rg-verso</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações importantes sobre o paciente..."
              rows={3}
            />
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-gray-600" />
                <Label className="text-base font-semibold">Segurança e Privacidade</Label>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Proteger dados sensíveis com senha?</Label>
                    <p className="text-xs text-gray-500">Exigirá uma senha para ver exames, histórico, etc.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sensitiveDataPassword"
                      checked={formData.sensitiveDataPasswordActive}
                      onChange={(e) => {
                        const isActive = e.target.checked;
                        setFormData(prev => ({ 
                          ...prev, 
                          sensitiveDataPasswordActive: isActive,
                          sensitiveDataPassword: isActive ? prev.sensitiveDataPassword : ""
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formData.sensitiveDataPasswordActive && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="sensitivePassword" className="text-sm">Senha de Acesso Sensível</Label>
                    <Input
                      id="sensitivePassword"
                      type="password"
                      value={formData.sensitiveDataPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, sensitiveDataPassword: e.target.value }))}
                      placeholder="Use uma senha fácil de lembrar. Esta senha será solicitada para ver dados sensíveis."
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Use uma senha fácil de lembrar. Esta senha será solicitada para ver dados sensíveis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updatePatientMutation.isPending || isUploading}>
              {isUploading ? "Enviando arquivos..." : updatePatientMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
