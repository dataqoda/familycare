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
  const bloodTypeOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];
  const photoOptions = [
    { value: "👤", label: "Padrão" },
    { value: "👨", label: "Homem" },
    { value: "👩", label: "Mulher" },
    { value: "🧒", label: "Criança" },
    { value: "👶", label: "Bebê" },
    { value: "👴", label: "Idoso" },
    { value: "👵", label: "Idosa" },
    { value: "🧑‍⚕️", label: "Profissional de Saúde" },
    { value: "👨‍⚕️", label: "Médico" },
    { value: "👩‍⚕️", label: "Enfermeira" },
  ];

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6">
          <DialogTitle className="text-xl font-bold">✏️ Editar Familiar</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 border-b-2 border-blue-200 pb-3 mb-4 flex items-center gap-2">
              📋 <span>Informações Pessoais</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                  <span className="text-red-500">*</span> Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                  <span className="text-red-500">*</span> Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType" className="text-sm font-semibold text-blue-700">
                    🩸 Tipo Sanguíneo
                  </Label>
                  <Select value={formData.bloodType || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
                    <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-sm">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo" className="text-sm font-semibold text-blue-700">
                    📷 Avatar/Foto
                  </Label>
                  <Select value={formData.photoUrl} onValueChange={(value) => setFormData(prev => ({ ...prev, photoUrl: value }))}>
                    <SelectTrigger className="border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {photoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-200 pb-3 mb-4 flex items-center gap-2">
              📞 <span>Contato e Plano de Saúde</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName" className="text-sm font-semibold text-green-700">Nome do Contato de Emergência</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  placeholder="Nome do contato"
                  className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone" className="text-sm font-semibold text-green-700">Telefone de Emergência</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="insurancePlan" className="text-sm font-semibold text-green-700">
                  🏥 Plano de Saúde
                </Label>
                <Select value={formData.insurancePlan} onValueChange={(value) => setFormData(prev => ({ ...prev, insurancePlan: value }))}>
                  <SelectTrigger className="border-2 border-green-200 focus:border-green-500 rounded-lg shadow-sm">
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
                <Label htmlFor="insuranceNumber" className="text-sm font-semibold text-green-700">Número da Carteirinha</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                  placeholder="Número da carteirinha"
                  className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-yellow-100">
            <h3 className="text-lg font-bold text-yellow-800 border-b-2 border-yellow-200 pb-3 mb-4 flex items-center gap-2">
              📸 Upload de Documentos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceCardFront" className="text-sm font-semibold text-yellow-700">Carteirinha - Frente</Label>
                <Input
                  id="insuranceCardFront"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm file:bg-yellow-400 file:text-white file:rounded-lg file:px-4 file:py-2 file:border-0 file:cursor-pointer hover:file:bg-yellow-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'insuranceCardFrontUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.insuranceCardFrontUrl || patient?.insuranceCardFrontUrl) && (
                  <p className="text-xs text-green-600 mt-1">✓ Arquivo atual: carteirinha-frente</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceCardBack" className="text-sm font-semibold text-yellow-700">Carteirinha - Verso</Label>
                <Input
                  id="insuranceCardBack"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm file:bg-yellow-400 file:text-white file:rounded-lg file:px-4 file:py-2 file:border-0 file:cursor-pointer hover:file:bg-yellow-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'insuranceCardBackUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.insuranceCardBackUrl || patient?.insuranceCardBackUrl) && (
                  <p className="text-xs text-green-600 mt-1">✓ Arquivo atual: carteirinha-verso</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="idCardFront" className="text-sm font-semibold text-yellow-700">RG - Frente</Label>
                <Input
                  id="idCardFront"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm file:bg-yellow-400 file:text-white file:rounded-lg file:px-4 file:py-2 file:border-0 file:cursor-pointer hover:file:bg-yellow-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'idCardFrontUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.idCardFrontUrl || patient?.idCardFrontUrl) && (
                  <p className="text-xs text-green-600 mt-1">✓ Arquivo atual: rg-frente</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardBack" className="text-sm font-semibold text-yellow-700">RG - Verso</Label>
                <Input
                  id="idCardBack"
                  type="file"
                  accept="image/*,.pdf"
                  className="text-sm file:bg-yellow-400 file:text-white file:rounded-lg file:px-4 file:py-2 file:border-0 file:cursor-pointer hover:file:bg-yellow-500"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'idCardBackUrl');
                  }}
                  disabled={isUploading}
                />
                {(formData.idCardBackUrl || patient?.idCardBackUrl) && (
                  <p className="text-xs text-green-600 mt-1">✓ Arquivo atual: rg-verso</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 border-b-2 border-blue-200 pb-3 mb-4 flex items-center gap-2">
              📝 Outras Informações
            </h3>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-blue-700">Alergias</Label>
              <div className="flex gap-2">
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="Digite uma alergia"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                />
                <Button type="button" onClick={addAllergy} variant="outline" className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50">
                  Adicionar
                </Button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {formData.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-3 mb-4 flex items-center gap-2">
              📝 Observações
            </h3>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações importantes sobre o paciente..."
              rows={4}
              className="border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-lg shadow-sm"
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
              <Label className="text-lg font-bold text-purple-800">Segurança e Privacidade</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-purple-700">Proteger dados sensíveis com senha?</Label>
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
                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                </div>
              </div>

              {formData.sensitiveDataPasswordActive && (
                <div className="space-y-2 ml-4 border-l-2 border-purple-200 pl-4">
                  <Label htmlFor="sensitivePassword" className="text-sm font-semibold text-purple-700">Senha de Acesso Sensível</Label>
                  <Input
                    id="sensitivePassword"
                    type="password"
                    value={formData.sensitiveDataPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, sensitiveDataPassword: e.target.value }))}
                    placeholder="Defina uma senha segura"
                    className="border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg shadow-sm text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Use uma senha fácil de lembrar. Esta senha será solicitada para ver dados sensíveis.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-xl -mx-6 -mb-6 px-6 pb-6">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-2"
            >
              ❌ Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleSave}
              disabled={updatePatientMutation.isPending || isUploading}
            >
              {isUploading ? "📤 Enviando arquivos..." : updatePatientMutation.isPending ? "⏳ Salvando..." : "✅ Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}