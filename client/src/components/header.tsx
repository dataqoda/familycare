import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  onQuickRegister: () => void;
  onPatientRegister: () => void;
  onMenuToggle: () => void;
}

export default function Header({ onQuickRegister, onPatientRegister, onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3"
              onClick={onMenuToggle}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prontuário Familiar 👨‍👩‍👧‍👦</h1>
              <p className="text-sm text-gray-600 mt-1">Gerencie a saúde de toda a família em um só lugar</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onQuickRegister}
            >
              ⚡ Registro Rápido
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onPatientRegister}
            >
              ➕ Cadastrar Paciente
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
