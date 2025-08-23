
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";

interface PasswordPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordSubmit: (password: string) => void;
  patientName: string;
}

export default function PasswordPromptModal({ 
  open, 
  onOpenChange, 
  onPasswordSubmit,
  patientName 
}: PasswordPromptModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, digite a senha");
      return;
    }
    onPasswordSubmit(password);
    setPassword("");
    setError("");
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Dados Protegidos</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-4">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Os dados sensíveis de <strong>{patientName}</strong> estão protegidos por senha.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Digite a senha para visualizar exames, histórico e senhas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Digite a senha do paciente"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Confirmar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
