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
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto fixed-position">
        <DialogHeader>
          <DialogTitle>⚡ Registro Rápido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Select Patient */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">1. Selecionar Familiar</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um familiar..." />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                avoidCollisions={false}
                className="z-[100] max-h-[150px] overflow-auto"
              >
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.avatar} {patient.name}
                  </SelectItem>
                )) || []}
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
                  onClick={() => setSelectedType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Step 3: Fill Details */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">3. Preencher Detalhes</Label>
            <div className="space-y-3">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Data"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição..."
                rows={3}
              />
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Anexos (opcional)</Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
            </div>
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
                      checked={sensitiveDataPasswordActive}
                      onChange={(e) => {
                        const isActive = e.target.checked;
                        setSensitiveDataPasswordActive(isActive);
                        if (!isActive) {
                          setSensitiveDataPassword(""); // Clear password if checkbox is unchecked
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                {sensitiveDataPasswordActive && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="sensitivePassword" className="text-sm">Senha de Acesso Sensível</Label>
                    <Input
                      id="sensitivePassword"
                      type="password"
                      value={sensitiveDataPassword}
                      onChange={(e) => setSensitiveDataPassword(e.target.value)}
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