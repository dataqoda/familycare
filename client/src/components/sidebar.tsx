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
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Prontuário Família</h2>
            <p className="text-sm text-gray-600">Gestão de Saúde</p>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center px-4 py-2 text-gray-700 bg-purple-50 rounded-lg">
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            <Link href="/search" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">🔍</span>
              Busca
            </Link>
            
            <div className="pt-4">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pacientes</h3>
              <div className="mt-2 space-y-1">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      onPatientClick(patient.id);
                      onToggle(); // Close sidebar on mobile after selection
                    }}
                    className="w-full text-left flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <span className="mr-3">{patient.photoUrl}</span>
                    {patient.name}
                  </button>
                ))}
              </div>
            </div>
          </nav>
          
          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Usuário</p>
                <p className="text-xs text-gray-500">usuario@email.com</p>
              </div>
            </div>
            <button className="mt-2 w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
