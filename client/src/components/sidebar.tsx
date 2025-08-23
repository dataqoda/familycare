import { Link } from "wouter";
import type { Patient } from "@shared/schema";

interface SidebarProps {
  patients: Patient[];
  isOpen: boolean;
  onToggle: () => void;
  onPatientClick: (patientId: string) => void;
}

export default function Sidebar({ patients, isOpen, onToggle, onPatientClick }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden backdrop-blur-sm transition-all duration-300"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 shadow-2xl transform transition-all duration-500 ease-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 border-r border-gradient-to-b from-purple-200/30 to-blue-200/30 backdrop-blur-xl`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="relative p-6 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/30">
                  <span className="text-2xl">🏥</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    Prontuário Família
                  </h2>
                  <p className="text-sm text-purple-100/90 font-medium">Gestão de Saúde</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-6 space-y-4">
            <Link href="/" className="group relative overflow-hidden flex items-center px-5 py-4 text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-xl">📊</span>
                </div>
                <span className="font-semibold text-lg">Dashboard</span>
              </div>
            </Link>
            
            <Link href="/search" className="group relative overflow-hidden flex items-center px-5 py-4 text-gray-700 hover:text-white bg-gradient-to-r from-transparent to-transparent hover:from-blue-500 hover:to-blue-600 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative z-10 flex items-center">
                <div className="w-10 h-10 bg-blue-50 group-hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                  <span className="text-xl">🔍</span>
                </div>
                <span className="font-semibold text-lg group-hover:text-white transition-colors duration-300">Busca</span>
              </div>
            </Link>
            
            <div className="pt-8">
              <div className="flex items-center px-5 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <span className="text-lg">👥</span>
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Pacientes</h3>
              </div>
              <div className="space-y-3">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onPatientClick(patient.id);
                      onToggle();
                    }}
                    className="w-full text-left group relative overflow-hidden flex items-center px-5 py-4 text-gray-700 hover:text-white bg-gradient-to-r from-transparent to-transparent hover:from-green-500 hover:to-green-600 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative z-10 flex items-center w-full">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-white/20 group-hover:to-white/30 rounded-full flex items-center justify-center mr-4 transition-all duration-300 shadow-sm group-hover:shadow-lg ring-2 ring-transparent group-hover:ring-white/30">
                        <span className="text-lg">{patient.photoUrl}</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-base text-gray-800 group-hover:text-white transition-colors duration-300 block">
                          {patient.name}
                        </span>
                        <div className="text-xs text-gray-500 group-hover:text-white/70 transition-colors duration-300 font-medium">
                          Paciente
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>
          
          {/* User Info */}
          <div className="p-6 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm border-t border-gray-200/50">
            <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 via-white to-blue-50 rounded-2xl shadow-lg border border-purple-100/50">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-200/50">
                <span className="text-white font-bold text-base">U</span>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-bold text-gray-800">Usuário</p>
                <p className="text-xs text-gray-600 font-medium">usuario@email.com</p>
              </div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center px-5 py-3 text-sm font-semibold text-gray-600 hover:text-red-600 bg-gradient-to-r from-transparent to-transparent hover:from-red-50 hover:to-red-100 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              <span className="mr-2 text-lg">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
