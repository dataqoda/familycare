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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6">
          <DialogTitle className="text-xl font-bold">✨ Cadastrar Novo Familiar</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <div className="space-y-4 bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 border-b-2 border-blue-200 pb-3 mb-4 flex items-center gap-2">
              📋 <span>Informações Pessoais</span>
            </h3>

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
                <Select value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))}>
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

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-sm font-semibold text-blue-700">
                🆔 CPF
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-blue-700">
                📱 Telefone Pessoal
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-blue-700">
                🏠 Endereço Completo
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro, cidade, CEP"
                rows={2}
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor" className="text-sm font-semibold text-blue-700">
                👨‍⚕️ Médico Responsável
              </Label>
              <Input
                id="doctor"
                value={formData.doctor}
                onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
                placeholder="Dr. Nome do médico"
                className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
              />
            </div>

            {/* Alergias */}
            <div className="space-y-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
              <Label className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                ⚠️ Alergias e Restrições
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Digite uma alergia..."
                    className="border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg shadow-sm"
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
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
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
                      className="text-xs justify-start border-orange-200 text-orange-700 hover:bg-orange-100 disabled:bg-gray-100 disabled:text-gray-400"
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
                      <Badge key={allergy} className="bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        ⚠️ {allergy}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
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
          <div className="space-y-4 bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-200 pb-3 mb-4 flex items-center gap-2">
              📞 <span>Contato de Emergência</span>
            </h3>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactName" className="text-sm font-semibold text-green-700">
                👤 Nome do Contato
              </Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                placeholder="Nome completo do contato"
                className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone" className="text-sm font-semibold text-green-700">
                📱 Telefone
              </Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
              />
            </div>

            <h3 className="text-lg font-bold text-green-800 border-b-2 border-green-200 pb-3 mb-4 mt-6 flex items-center gap-2">
              🏥 <span>Plano de Saúde</span>
            </h3>

            <div className="space-y-2">
              <Label htmlFor="insurancePlan" className="text-sm font-semibold text-green-700">
                🏥 Operadora
              </Label>
              <Select value={formData.insurancePlan} onValueChange={(value) => setFormData(prev => ({ ...prev, insurancePlan: value }))}>
                <SelectTrigger className="border-2 border-green-200 focus:border-green-500 rounded-lg shadow-sm">
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

            <div className="space-y-2">
              <Label htmlFor="insuranceNumber" className="text-sm font-semibold text-green-700">
                🎫 Número da Carteirinha
              </Label>
              <Input
                id="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                placeholder="Número do plano de saúde"
                className="border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg shadow-sm"
              />
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                📄 <span>Upload de Documentos</span>
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="photoUpload" className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                    📷 Foto do Paciente
                  </Label>
                  <Input
                    id="photoUpload"
                    type="file"
                    accept="image/*"
                    className="text-sm border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 file:font-medium hover:file:bg-blue-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="insuranceCardUpload" className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                    🎫 Foto da Carteirinha do Plano
                  </Label>
                  <Input
                    id="insuranceCardUpload"
                    type="file"
                    accept="image/*"
                    className="text-sm border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 file:font-medium hover:file:bg-blue-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="documentsUpload" className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                    📋 Documentos (RG, CPF)
                  </Label>
                  <Input
                    id="documentsUpload"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="text-sm border-2 border-blue-200 focus:border-blue-500 rounded-lg shadow-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-700 file:font-medium hover:file:bg-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200 shadow-sm">
              <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                🔒 <span>Configurações de Segurança</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-amber-200">
                  <input
                    type="checkbox"
                    id="usePassword"
                    checked={formData.usePassword || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, usePassword: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 border-2 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <Label htmlFor="usePassword" className="text-sm font-semibold text-amber-700 cursor-pointer">
                    Proteger dados sensíveis com senha
                  </Label>
                </div>
                {formData.usePassword && (
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-amber-200">
                    <Label htmlFor="password" className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                      🔑 Senha de Proteção
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite uma senha para proteger os dados"
                      className="text-sm border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-lg shadow-sm"
                    />
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      💡 Esta senha será necessária para visualizar registros médicos sensíveis
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-xl -mx-6 -mb-6 px-6 pb-6">
          <Button variant="outline" onClick={handleClose} className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-2">
            ❌ Cancelar
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleSave}
            disabled={createPatientMutation.isPending}
          >
            {createPatientMutation.isPending ? "🔄 Cadastrando..." : "✅ Cadastrar Familiar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}