import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Patient, InsertMedicalRecord } from "@shared/schema";
import { Shield } from "lucide-react";

interface QuickRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
}

export default function QuickRegisterModal({ open, onOpenChange, patients = [] }: QuickRegisterModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [sensitiveDataPasswordActive, setSensitiveDataPasswordActive] = useState<boolean>(false);
  const [sensitiveDataPassword, setSensitiveDataPassword] = useState<string>("");

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
    setDate("");
    setDescription("");
    setSensitiveDataPasswordActive(false);
    setSensitiveDataPassword("");
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!selectedPatient || !selectedType || !date || !description) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    createRecordMutation.mutate({
      patientId: selectedPatient,
      type: selectedType,
      date,
      description,
      attachments: [],
      // TODO: Add sensitive data protection logic here if needed for the record itself
      // For now, the password is set on the patient profile level in other components
    });
  };

  const typeOptions = [
    { value: "exam", label: "📋 Exame" },
    { value: "medication", label: "💊 Medicação" },
    { value: "appointment", label: "📅 Consulta" },
    { value: "history", label: "📝 Histórico" },
    { value: "incident", label: "⚠️ Incidente" },
    { value: "pending", label: "📋 Pendência" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content-constrained bg-gradient-to-br from-blue-50 to-purple-50">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4 mb-6">
          <DialogTitle className="text-xl font-bold">⚡ Registro Rápido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Patient */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2">1</span>
              Selecionar Familiar
            </Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="bg-white/70 backdrop-blur-sm border-blue-200 hover:border-blue-300 focus:border-blue-400 transition-all duration-300">
                <SelectValue placeholder="Escolha um familiar..." />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                avoidCollisions={false}
                className="z-[100] max-h-[150px] overflow-auto border-0 shadow-xl"
              >
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id} className="hover:bg-blue-50">
                    {patient.photoUrl} {patient.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Type */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
            <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">2</span>
              Escolher Tipo
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  className={`p-3 text-sm justify-start border-2 transition-all duration-300 ${
                    selectedType === option.value 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-500 shadow-lg transform scale-105' 
                      : 'bg-white/70 backdrop-blur-sm border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Step 3: Fill Details */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-100">
            <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs mr-2">3</span>
              Preencher Detalhes
            </Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">📅 Data</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white/70 backdrop-blur-sm border-orange-200 hover:border-orange-300 focus:border-orange-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">📝 Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada..."
                  rows={3}
                  className="bg-white/70 backdrop-blur-sm border-orange-200 hover:border-orange-300 focus:border-orange-400 transition-all duration-300 resize-none"
                />
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  📎 Arquivos do Registro
                </Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="text-sm text-gray-600 bg-white/70 border-orange-200 hover:border-orange-300 focus:border-orange-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-orange-100 file:to-pink-100 file:text-orange-700 hover:file:from-orange-200 hover:file:to-pink-200 transition-all duration-300"
                />
                <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded border border-orange-200">
                  💡 <strong>Múltiplos arquivos:</strong> Selecione vários arquivos de uma vez (exames, receitas, relatórios, fotos, etc.). Formatos aceitos: PDF, PNG, JPG, JPEG, DOC, DOCX
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <Label className="text-base font-bold text-amber-900">🔒 Segurança e Privacidade</Label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-amber-200">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-amber-800">Proteger dados sensíveis com senha?</Label>
                    <p className="text-xs text-amber-600">Exigirá uma senha para ver exames, histórico, etc.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sensitiveDataPassword"
                      checked={sensitiveDataPasswordActive}
                      onChange={(e) => {
                        const isActive = e.target.checked;
                        setSensitiveDataPasswordActive(isActive);
                        if (!isActive) {
                          setSensitiveDataPassword(""); // Clear password if checkbox is unchecked
                        }
                      }}
                      className="w-4 h-4 text-amber-600 bg-white border-2 border-amber-300 rounded focus:ring-amber-500 focus:ring-2"
                    />
                  </div>
                </div>

                {sensitiveDataPasswordActive && (
                  <div className="space-y-3 bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-amber-200">
                    <Label htmlFor="sensitivePassword" className="text-sm font-semibold text-amber-800 flex items-center gap-1">
                      🔑 Senha de Acesso Sensível
                    </Label>
                    <Input
                      id="sensitivePassword"
                      type="password"
                      value={sensitiveDataPassword}
                      onChange={(e) => setSensitiveDataPassword(e.target.value)}
                      placeholder="Digite uma senha fácil de lembrar..."
                      className="text-sm bg-white/70 border-2 border-amber-200 hover:border-amber-300 focus:border-amber-400 transition-all duration-300"
                    />
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      💡 Esta senha será solicitada para ver dados sensíveis como exames e histórico médico.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-xl -mx-6 -mb-6 px-6 pb-6">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 font-semibold"
          >
            ❌ Cancelar
          </Button>
          <Button
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-bold"
            onClick={handleSave}
            disabled={createRecordMutation.isPending}
          >
            {createRecordMutation.isPending ? "🔄 Salvando..." : "✨ Salvar Registro"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}