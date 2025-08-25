
export async function deletePatient(patientId: string): Promise<void> {
  const response = await fetch(`/api/patients/${patientId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete patient');
  }
}
