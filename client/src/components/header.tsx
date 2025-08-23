import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  onQuickRegister: () => void;
  onPatientRegister: () => void;
  onMenuToggle: () => void;
}

export default function Header({ onQuickRegister, onPatientRegister, onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Left side - Logo and menu */}
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2 p-2"
              onClick={onMenuToggle}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Prontuário Familiar 👨‍👩‍👧‍👦
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-600 mt-0.5">
                Gerencie a saúde de toda a família em um só lugar
              </p>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2 ml-2">
            <Button 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9"
              onClick={onQuickRegister}
            >
              <span className="hidden sm:inline">⚡ Registro</span>
              <span className="sm:hidden">⚡</span>
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9"
              onClick={onPatientRegister}
            >
              <span className="hidden sm:inline">➕ Cadastrar</span>
              <span className="sm:hidden">➕</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
