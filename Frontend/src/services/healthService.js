import api from './api';

export const healthService = {
  // Doctors
  getDoctors: async () => {
    const response = await api.get('/health/doctors');
    return response.data;
  },

  // Appointments
  createAppointment: async (appointmentData) => {
    const response = await api.post('/health/appointments', appointmentData);
    return response.data;
  },

  getStudentAppointments: async (studentId) => {
    const response = await api.get(`/health/appointments/student/${studentId}`);
    return response.data;
  },

  getDoctorAppointments: async (doctorId) => {
    const response = await api.get(`/health/appointments/doctor/${doctorId}`);
    return response.data;
  },

  approveAppointment: async (appointmentId) => {
    const response = await api.put(`/health/appointments/${appointmentId}/approve`);
    return response.data;
  },

  rejectAppointment: async (appointmentId) => {
    const response = await api.put(`/health/appointments/${appointmentId}/reject`);
    return response.data;
  },

  // Prescriptions
  uploadPrescription: async (formData) => {
    const response = await api.post('/health/prescriptions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getStudentPrescriptions: async (studentId) => {
    const response = await api.get(`/health/prescriptions/student/${studentId}`);
    return response.data;
  },

  getDoctorPrescriptions: async (doctorId) => {
    const response = await api.get(`/health/prescriptions/doctor/${doctorId}`);
    return response.data;
  },

  getPharmacyPrescriptions: async (pharmacyId) => {
    const response = await api.get(`/health/prescriptions/pharmacy/${pharmacyId}`);
    return response.data;
  },

  approvePrescription: async (prescriptionId) => {
    const response = await api.put(`/health/prescriptions/${prescriptionId}/approve`);
    return response.data;
  },

  rejectPrescription: async (prescriptionId) => {
    const response = await api.put(`/health/prescriptions/${prescriptionId}/reject`);
    return response.data;
  },

  // Feedback
  submitFeedback: async (feedbackData) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  getDoctorFeedback: async (doctorId) => {
    const response = await api.get(`/feedback/doctor/${doctorId}`);
    return response.data;
  },
};
