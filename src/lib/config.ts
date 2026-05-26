export const API_CONFIG = {
  // Ubah ke 'live' untuk menghubungkan ke backend Humaid secara langsung
  // Atau gunakan 'mock' untuk simulasi interaktif tanpa perlu menyalakan backend
  mode: (process.env.NEXT_PUBLIC_API_MODE as 'live' | 'mock') || 'mock',
  
  // Alamat base URL API backend Humaid
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
};
