
const appointments = [
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666", // Assumindo que este é um ID de paciente existente
    type: "appointment",
    title: "Consulta Cardiologia",
    date: "25/08/2025",
    time: "09:00",
    doctor: "Dr. João Silva",
    specialty: "Cardiologia",
    clinicHospital: "Hospital São Lucas",
    address: "Rua das Flores, 123 - Centro",
    mapUrl: "https://maps.google.com/?q=Hospital+São+Lucas+Centro",
    description: "Consulta de rotina cardiológica"
  },
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666",
    type: "appointment", 
    title: "Consulta Dermatologia",
    date: "28/08/2025",
    time: "14:30",
    doctor: "Dra. Maria Santos",
    specialty: "Dermatologia",
    clinicHospital: "Clínica Pele Saudável",
    address: "Av. Principal, 456 - Jardins",
    mapUrl: "https://maps.google.com/?q=Clínica+Pele+Saudável+Jardins",
    description: "Avaliação dermatológica preventiva"
  },
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666",
    type: "appointment",
    title: "Consulta Neurologia", 
    date: "02/09/2025",
    time: "10:15",
    doctor: "Dr. Carlos Oliveira",
    specialty: "Neurologia",
    clinicHospital: "Instituto Neurológico",
    address: "Rua da Saúde, 789 - Vila Médica",
    mapUrl: "https://maps.google.com/?q=Instituto+Neurológico+Vila+Médica",
    description: "Acompanhamento neurológico"
  },
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666",
    type: "appointment",
    title: "Consulta Ortopedia",
    date: "05/09/2025", 
    time: "16:00",
    doctor: "Dr. Roberto Lima",
    specialty: "Ortopedia",
    clinicHospital: "Centro Ortopédico",
    address: "Rua dos Ossos, 321 - Bela Vista",
    mapUrl: "https://maps.google.com/?q=Centro+Ortopédico+Bela+Vista",
    description: "Consulta ortopédica especializada"
  },
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666",
    type: "appointment",
    title: "Consulta Ginecologia",
    date: "10/09/2025",
    time: "08:30", 
    doctor: "Dra. Ana Costa",
    specialty: "Ginecologia",
    clinicHospital: "Clínica da Mulher",
    address: "Av. das Américas, 654 - Copacabana",
    mapUrl: "https://maps.google.com/?q=Clínica+da+Mulher+Copacabana",
    description: "Exame ginecológico de rotina"
  },
  {
    patientId: "b6272a9b-b41b-4ad7-82b1-1e3c5ba88666",
    type: "appointment",
    title: "Consulta Oftalmologia",
    date: "15/09/2025",
    time: "11:45",
    doctor: "Dr. Pedro Ferreira", 
    specialty: "Oftalmologia",
    clinicHospital: "Clínica Visão Perfeita",
    address: "Rua da Vista, 987 - Ipanema",
    mapUrl: "https://maps.google.com/?q=Clínica+Visão+Perfeita+Ipanema",
    description: "Exame oftalmológico completo"
  }
];

async function addTestAppointments() {
  for (const appointment of appointments) {
    try {
      const response = await fetch('http://localhost:5000/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointment)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Consulta adicionada:', appointment.title, 'em', appointment.date);
      } else {
        console.error('❌ Erro ao adicionar consulta:', appointment.title);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
  }
}

addTestAppointments();
