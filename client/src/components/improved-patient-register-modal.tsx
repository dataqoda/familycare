import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertPatient } from "@shared/schema";

interface ImprovedPatientRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImprovedPatientRegisterModal({ open, onOpenChange }: ImprovedPatientRegisterModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    cpf: "",
    phone: "",
    address: "",
    bloodType: "",
    doctor: "",
    allergies: [] as string[],
    photoUrl: "👤",
    emergencyContactName: "",
    emergencyContactPhone: "",
    insurancePlan: "",
    insuranceNumber: "",
    usePassword: false,
    password: "",
  });

  const [newAllergy, setNewAllergy] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const commonAllergies = [
    "Dipirona",
    "Penicilina",
    "Aspirina",
    "Ibuprofeno",
    "Sulfa",
    "Paracetamol",
    "Contraste",
    "Latex",
    "Poeira",
    "Pólen",
    "Camarão",
    "Amendoim",
    "Leite",
    "Ovo",
    "Lactose",
    "Glúten",
  ];

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-updates"] });
      toast({
        title: "Paciente cadastrado",
        description: "O paciente foi cadastrado com sucesso.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao cadastrar o paciente.",
        variant: "destructive",
      });
    },
  });

  const addAllergy = (allergy: string) => {
    if (allergy && !formData.allergies.includes(allergy)) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy]
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(allergy => allergy !== allergyToRemove)
    }));
  };

  const handleClose = () => {
    setFormData({
      name: "",
      birthDate: "",
      cpf: "",
      phone: "",
      address: "",
      bloodType: "",
      doctor: "",
      allergies: [],
      photoUrl: "👤",
      emergencyContactName: "",
      emergencyContactPhone: "",
      insurancePlan: "",
      insuranceNumber: "",
      usePassword: false,
      password: "",
    });
    setNewAllergy("");
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.birthDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos o nome e a data de nascimento.",
        variant: "destructive",
      });
      return;
    }

    if (formData.usePassword && (!formData.password || formData.password.length < 4)) {
      toast({
        title: "Senha inválida",
        description: "Por favor, digite uma senha com pelo menos 4 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const age = new Date().getFullYear() - new Date(formData.birthDate).getFullYear();

    const patientData: InsertPatient = {
      name: formData.name,
      birthDate: formData.birthDate,
      bloodType: formData.bloodType || null,
      doctor: formData.doctor || null,
      allergies: formData.allergies,
      photoUrl: formData.photoUrl,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      insurancePlan: formData.insurancePlan || null,
      insuranceNumber: formData.insuranceNumber || null,
    };

    createPatientMutation.mutate(patientData);
  };

  const photoOptions = [
    { value: "👨", label: "👨 Homem" },
    { value: "👩", label: "👩 Mulher" },
    { value: "👧", label: "👧 Menina" },
    { value: "👦", label: "👦 Menino" },
    { value: "👴", label: "👴 Idoso" },
    { value: "👵", label: "👵 Idosa" },
    { value: "👶", label: "👶 Bebê" },
    { value: "👤", label: "👤 Genérico" },
  ];

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

  const insurancePlans = [
    "Unimed",
    "Amil",
    "Bradesco Saúde",
    "SulAmérica",
    "Golden Cross",
    "NotreDame Intermédica",
    "Hapvida",
    "Prevent Senior",
    "São Cristóvão",
    "Particular",
    "SUS",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ Cadastrar Novo Familiar</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📋 Informações Pessoais
            </h3>

            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                <Select value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
              <div>
                <Label htmlFor="photo">Foto/Avatar</Label>
                <Select value={formData.photoUrl} onValueChange={(value) => setFormData(prev => ({ ...prev, photoUrl: value }))}>
                  <SelectTrigger>
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

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone Pessoal</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço Completo</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro, cidade, CEP"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="doctor">Médico Responsável</Label>
              <Input
                id="doctor"
                value={formData.doctor}
                onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
                placeholder="Dr. Nome do médico"
              />
            </div>

            {/* Alergias */}
            <div>
              <Label>Alergias e Restrições</Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Digite uma alergia..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAllergy(newAllergy);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAllergy(newAllergy)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {commonAllergies.map((allergy) => (
                    <Button
                      key={allergy}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start"
                      onClick={() => addAllergy(allergy)}
                      disabled={formData.allergies.includes(allergy)}
                    >
                      + {allergy}
                    </Button>
                  ))}
                </div>

                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies.map((allergy) => (
                      <Badge key={allergy} variant="secondary" className="flex items-center gap-1">
                        {allergy}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeAllergy(allergy)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informações de Contato e Plano */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              📞 Contato de Emergência
            </h3>

            <div>
              <Label htmlFor="emergencyContactName">Nome do Contato</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label htmlFor="emergencyContactPhone">Telefone</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">
              🏥 Plano de Saúde
            </h3>

            <div>
              <Label htmlFor="insurancePlan">Plano de Saúde</Label>
              <Select value={formData.insurancePlan} onValueChange={(value) => setFormData(prev => ({ ...prev, insurancePlan: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano..." />
                </SelectTrigger>
                <SelectContent>
                  {insurancePlans.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="insuranceNumber">Número da Carteirinha</Label>
              <Input
                id="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                placeholder="Número do plano de saúde"
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📄 Upload de Documentos</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="photoUpload" className="text-sm text-blue-700">Foto do Paciente</Label>
                  <Input
                    id="photoUpload"
                    type="file"
                    accept="image/*"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceCardUpload" className="text-sm text-blue-700">Foto da Carteirinha do Plano</Label>
                  <Input
                    id="insuranceCardUpload"
                    type="file"
                    accept="image/*"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="documentsUpload" className="text-sm text-blue-700">Documentos (RG, CPF)</Label>
                  <Input
                    id="documentsUpload"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-900 mb-3">🔒 Configurações de Segurança</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="usePassword"
                    checked={formData.usePassword || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, usePassword: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="usePassword" className="text-sm text-amber-700">
                    Proteger dados sensíveis com senha
                  </Label>
                </div>
                {formData.usePassword && (
                  <div>
                    <Label htmlFor="password" className="text-sm text-amber-700">Senha de Proteção</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite uma senha para proteger os dados"
                      className="text-sm"
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      Esta senha será necessária para visualizar registros médicos sensíveis
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={createPatientMutation.isPending}
          >
            {createPatientMutation.isPending ? "Cadastrando..." : "Cadastrar Familiar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}