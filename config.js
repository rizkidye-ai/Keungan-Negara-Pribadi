/* ============================================================
   Konfigurasi Supabase — ISI SETELAH BUAT PROJECT SUPABASE
   Lihat README.md bagian "Setup" untuk cara mendapatkan nilai ini.
   ============================================================ */
const SUPA_URL = 'https://ycwayxjizpsxctmlataa.supabase.co';
const SUPA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2F5eGppenBzeGN0bWxhdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjAzNzYsImV4cCI6MjEwMzEzNjM3Nn0.ZYDf_eRIug-UTtdf2rnELO93FM3wivQLluTmG3-0lPw';

const DEFAULT_CATEGORIES = {
  pengeluaran: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Tabungan', 'Lainnya'],
  pemasukan: ['Gaji', 'Bonus', 'Hadiah', 'Usaha', 'Lainnya']
};

const ACCOUNT_TYPES = {
  cash:    { label: 'Cash',      icon: '💵' },
  bank:    { label: 'Bank',      icon: '🏦' },
  ewallet: { label: 'E-wallet',  icon: '📱' },
  lainnya: { label: 'Lainnya',   icon: '💼' }
};

const CATEGORY_ICONS = {
  Makan: '🍔', Transport: '🚗', Belanja: '🛍️', Tagihan: '🧾', Hiburan: '🎬',
  Kesehatan: '💊', Pendidikan: '📚', Tabungan: '🐷', Lainnya: '📦',
  Gaji: '💼', Bonus: '🎁', Hadiah: '🎉', Usaha: '📈', Transfer: '⇄'
};
