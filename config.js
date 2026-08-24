/* ============================================================
   Konfigurasi Supabase — ISI SETELAH BUAT PROJECT SUPABASE
   Lihat README.md bagian "Setup" untuk cara mendapatkan nilai ini.
   ============================================================ */
const SUPA_URL = 'https://GANTI-DENGAN-PROJECT-ID.supabase.co';
const SUPA_ANON_KEY = 'GANTI-DENGAN-ANON-PUBLIC-KEY';

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
