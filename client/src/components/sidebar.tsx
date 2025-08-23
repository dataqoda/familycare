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
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-white to-gray-50 shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏥</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Prontuário Família</h2>
                <p className="text-sm text-purple-100">Gestão de Saúde</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-6 space-y-3">
            <Link href="/" className="group flex items-center px-4 py-3 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">📊</span>
              </div>
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link href="/search" className="group flex items-center px-4 py-3 text-gray-700 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-200">
              <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">🔍</span>
              </div>
              <span className="font-medium">Busca</span>
            </Link>
            
            <div className="pt-6">
              <div className="flex items-center px-4 mb-4">
                <span className="text-lg mr-2">👥</span>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Pacientes</h3>
              </div>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onPatientClick(patient.id);
                      onToggle(); // Close sidebar on mobile after selection
                    }}
                    className="w-full text-left group flex items-center px-4 py-3 text-gray-700 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:from-purple-200 group-hover:to-blue-200">
                      <span className="text-lg">{patient.photoUrl}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{patient.name}</span>
                      <div className="text-xs text-gray-500">Paciente</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>
          
          {/* User Info */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">U</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-800">Usuário</p>
                <p className="text-xs text-gray-500">usuario@email.com</p>
              </div>
            </div>
            <button className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200">
              <span className="mr-2">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
