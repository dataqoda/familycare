import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertPatient } from "@shared/schema";

interface PatientRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientRegisterModal({ open, onOpenChange }: PatientRegisterModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bloodType: "",
    doctor: "",
    allergies: "",
    avatar: "👤",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleClose = () => {
    setFormData({
      name: "",
      age: "",
      bloodType: "",
      doctor: "",
      allergies: "",
      avatar: "👤",
    });
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.age) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e idade.",
        variant: "destructive",
      });
      return;
    }

    const allergiesArray = formData.allergies
      .split(",")
      .map(allergy => allergy.trim())
      .filter(allergy => allergy.length > 0);

    createPatientMutation.mutate({
      name: formData.name,
      age: parseInt(formData.age),
      bloodType: formData.bloodType || undefined,
      doctor: formData.doctor || undefined,
      allergies: allergiesArray,
      avatar: formData.avatar,
    });
  };

  const avatarOptions = [
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>➕ Cadastrar Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Idade"
                min="0"
                max="120"
              />
            </div>
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
              <Label htmlFor="avatar">Avatar</Label>
              <Select value={formData.avatar} onValueChange={(value) => setFormData(prev => ({ ...prev, avatar: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {avatarOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="doctor">Médico Responsável</Label>
            <Input
              id="doctor"
              value={formData.doctor}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
              placeholder="Nome do médico"
            />
          </div>

          <div>
            <Label htmlFor="allergies">Alergias</Label>
            <Input
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
              placeholder="Separe por vírgulas (ex: Penicilina, Pólen)"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSave}
            disabled={createPatientMutation.isPending}
          >
            {createPatientMutation.isPending ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
