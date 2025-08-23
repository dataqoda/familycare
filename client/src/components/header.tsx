import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface HeaderProps {
  onQuickRegister: () => void;
  onPatientRegister: () => void;
  onMenuToggle: () => void;
}

export default function Header({ onQuickRegister, onPatientRegister, onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 shadow-xl border-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 sm:py-5">
          {/* Left side - Logo and menu */}
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3 p-2 text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              onClick={onMenuToggle}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl">👨‍👩‍👧‍👦</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                    Prontuário Familiar
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-purple-100 mt-0.5">
                    Gerencie a saúde de toda a família em um só lugar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-3">
            <Button 
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 h-9 sm:h-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={onQuickRegister}
            >
              <span className="hidden sm:inline flex items-center gap-2">
                ⚡ <span className="font-medium">Registro Rápido</span>
              </span>
              <span className="sm:hidden">⚡</span>
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 h-9 sm:h-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={onPatientRegister}
            >
              <span className="hidden sm:inline flex items-center gap-2">
                ➕ <span className="font-medium">Cadastrar</span>
              </span>
              <span className="sm:hidden">➕</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
