
import { Button } from "@/components/ui/button";
import { Menu, UserPlus, FileText, Plus } from "lucide-react";

interface HeaderProps {
  onQuickRegister: () => void;
  onPatientRegister: () => void;
  onMenuToggle: () => void;
}

export default function Header({ onQuickRegister, onPatientRegister, onMenuToggle }: HeaderProps) {
  return (
    <header className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700 shadow-2xl border-b border-purple-200/20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Menu Button + Logo */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden w-12 h-12 text-white hover:bg-white/20 hover:text-white rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-110"
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-xl ring-2 ring-white/30 transition-transform duration-300 hover:scale-110">
                <span className="text-2xl sm:text-3xl lg:text-4xl">👨‍👩‍👧‍👦</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent leading-tight">
                  Prontuário Familiar
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-purple-100/90 font-medium tracking-wide">
                  Gerencie a saúde de toda a família em um só lugar
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Title (only visible on small screens) */}
          <div className="sm:hidden flex-1 text-center px-2">
            <h1 className="text-lg font-bold text-white truncate">
              Prontuário Familiar
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Button
              onClick={onQuickRegister}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-1.5 xs:px-2 sm:px-6 py-1.5 xs:py-2 sm:py-3 rounded-lg xs:rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border border-blue-400/30 min-w-0 flex-shrink"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2">
                <FileText className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline font-semibold whitespace-nowrap">Registro Rápido</span>
                <span className="xs:hidden font-semibold text-xs whitespace-nowrap">Reg</span>
                <span className="hidden xs:inline sm:hidden font-semibold text-xs whitespace-nowrap">Registro</span>
              </div>
            </Button>
            
            <Button
              onClick={onPatientRegister}
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border border-green-400/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-1 sm:space-x-2">
                <UserPlus className="w-3 h-3 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-semibold">Cadastrar</span>
                <span className="sm:hidden font-semibold text-xs">
                  <Plus className="w-3 h-3" />
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 opacity-60"></div>
    </header>
  );
}
