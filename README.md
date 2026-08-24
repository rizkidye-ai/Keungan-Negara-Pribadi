# Keuangan TMRIZK

Aplikasi web (PWA) untuk manajemen keuangan pribadi: multi akun/dompet, pemasukan & pengeluaran, anggaran per kategori, target tabungan, dan transaksi berulang (tagihan/langganan rutin). Bisa dipakai bareng-bareng (kamu, saudara, teman) — tiap orang login pakai akun Google masing-masing, dan datanya **privat per orang** (tidak saling terlihat).

## Fitur
- **Akun/dompet** — saldo terpisah per rekening (Cash, Bank, E-wallet, dll), lihat total kekayaan
- **Transaksi** — pemasukan, pengeluaran, transfer antar akun
- **Anggaran** — limit pengeluaran per kategori tiap bulan, progress bar terpakai/sisa
- **Tabungan** — target nabung dengan progress, bisa dikaitkan langsung dari transaksi pengeluaran
- **Transaksi berulang** — tagihan/langganan rutin otomatis tercatat tiap bulan saat app dibuka setelah tanggal jatuh tempo

## Cara kerja
- Frontend: `index.html` + `app.js` (vanilla JS, tanpa build step) — tinggal upload, tidak perlu `npm install`.
- Backend: Supabase (database + login Google), gratis untuk skala pemakaian pribadi/keluarga.
- Setiap baris data terkunci ke `user_id` pemiliknya lewat Row Level Security (RLS) — orang lain login pun tidak bisa lihat/ubah data kamu.

## Setup (sekali saja)

### 1. Buat project Supabase
1. Buka https://supabase.com → **New project**.
2. Catat **Project URL** dan **anon public key** (Settings → API).
3. Buka **SQL Editor** → New query → tempel isi file [`supabase-schema.sql`](supabase-schema.sql) → **Run**.

### 2. Aktifkan login Google
1. Buka https://console.cloud.google.com/ → buat project (atau pakai yang sudah ada).
2. **APIs & Services → OAuth consent screen** → isi nama app "Keuangan TMRIZK", tambahkan email kamu sebagai test user (kalau masih mode Testing) atau publish ke External.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → tipe **Web application**.
4. Di **Authorized redirect URIs**, tambahkan:
   `https://<PROJECT-ID>.supabase.co/auth/v1/callback`
5. Simpan, copy **Client ID** dan **Client Secret**.
6. Di Supabase Dashboard → **Authentication → Providers → Google** → aktifkan, tempel Client ID & Client Secret → Save.
7. Di **Authentication → URL Configuration**, isi **Site URL** dengan `https://rizkidye-ai.github.io/Keungan-Negara-Pribadi/`, dan tambahkan alamat yang sama di **Redirect URLs**.

### 3. Isi kredensial di kode
Edit [`config.js`](config.js):
```js
const SUPA_URL = 'https://xxxxxxxx.supabase.co';
const SUPA_ANON_KEY = 'ey...';
```
Anon key aman ditaruh di frontend (bukan rahasia) — akses data tetap dijaga oleh RLS di server.

### 4. Deploy ke GitHub Pages
Repo: https://github.com/rizkidye-ai/Keungan-Negara-Pribadi (sudah di-push)
1. Buka repo itu → **Settings → Pages**.
2. Di **Build and deployment → Source**, pilih **Deploy from a branch**.
3. **Branch**: pilih `main`, folder `/ (root)` → **Save**.
4. Tunggu 1-2 menit, app akan aktif di `https://rizkidye-ai.github.io/Keungan-Negara-Pribadi/`.
5. Balik ke Supabase → **Authentication → URL Configuration**, pastikan Site URL & Redirect URLs pakai URL GitHub Pages ini (bukan localhost).

Setelah itu tinggal share link-nya ke saudara/teman — mereka tinggal buka, klik **Login dengan Google**, dan langsung bisa mulai catat keuangan sendiri (mulai dari menambah akun di tab **Akun**).

### 5. (Opsional) Icon PWA
`manifest.json` mereferensikan `icon-192.png` dan `icon-512.png` yang belum ada di folder ini. Tambahkan file PNG dengan nama itu supaya app bisa di-"Install" ke home screen HP dengan ikon custom. Tanpa file ini app tetap jalan normal di browser.

## Coba lokal
Buka lewat live server (VS Code Live Server, atau `python -m http.server` di folder ini) — jangan dibuka langsung sebagai file `file://` karena login Google butuh origin http/https.

## Alur pakai pertama kali
1. Login dengan Google.
2. Buka tab **Akun** → tambah akun pertama (misal "Cash" dengan saldo awal).
3. Mulai catat transaksi lewat tombol **+**.
4. (Opsional) Atur anggaran di tab **Anggaran**, target tabungan di tab **Tabungan**, dan tagihan rutin di tab **Akun → Transaksi Berulang**.
