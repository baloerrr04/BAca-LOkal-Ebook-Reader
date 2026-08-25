# Dokumen Perencanaan Proyek: Custom Ebook Reader

## 1. Ringkasan Proyek

Membangun platform _ebook reader_ berbasis web yang dirancang khusus untuk mengurangi kelelahan visual dan meningkatkan interaktivitas membaca. Sistem ini akan membungkus pengalaman membaca dengan tema yang dapat dikustomisasi secara mendalam dan fitur translasi _inline_.

## 2. Arsitektur & Teknologi (Tech Stack)

- **Frontend/Full-Stack Framework:** Next.js (App Router disarankan untuk manajemen rute API yang aman).
- **Database & BaaS:** Supabase (PostgreSQL untuk data relasional, Storage untuk file EPUB/PDF, Auth untuk manajemen sesi).
- **PWA & Offline Storage:** `next-pwa` untuk _service worker_, IndexedDB (via Dexie.js atau localForage) untuk _caching_ file buku di _client_.
- **Reader Engine:** Epub.js (menangani _parsing_ EPUB, _pagination_, dan _text selection_).
- **Layanan Eksternal:** Google Translate API.
- **Deployment:** Docker (menggunakan _multi-stage build_ untuk optimasi _image_ Next.js).

## 3. Desain Skema Database (Supabase / PostgreSQL)

Struktur relasional untuk mendukung sinkronisasi data antar perangkat:

- **`users`** (Dikelola oleh Supabase Auth)
- **`user_profiles`**
  - `id` (UUID, PK, FK ke users)
  - `theme_preference` (JSON - menyimpan warna, ukuran font, preferensi bionic reading)
  - `created_at`, `updated_at`
- **`books`**
  - `id` (UUID, PK)
  - `user_id` (UUID, FK ke users)
  - `title`, `author`, `cover_url`
  - `storage_path` (Path file di Supabase Storage)
  - `uploaded_at`
- **`bookmarks`** (Untuk sinkronisasi halaman terakhir)
  - `id` (UUID, PK)
  - `book_id` (UUID, FK)
  - `cfi` (String - Canonical Fragment Identifier dari Epub.js untuk lokasi presisi)
  - `progress_percentage` (Float)
  - `last_read_at` (Timestamp)
- **`highlights_translations`** (Opsional: menyimpan riwayat kata yang diterjemahkan)
  - `id`, `book_id`, `original_text`, `translated_text`, `cfi_location`

## 4. Fase Pengembangan (Roadmap)

### Fase 1: Inisiasi & Setup Infrastruktur (Minggu 1)

- [ ] Setup proyek Next.js baru.
- [ ] Konfigurasi Supabase (Proyek baru, setup tabel, RLS - Row Level Security).
- [ ] Implementasi autentikasi dasar (Login/Register via Supabase Auth).
- [ ] Setup Dockerfile. Membuat _multi-stage build_ (deps, builder, runner) agar _container_ Next.js ringan dan siap di-_deploy_.

### Fase 2: Core Reader & Manajemen File (Minggu 2)

- [ ] Implementasi fitur unggah file EPUB ke Supabase Storage.
- [ ] Integrasi **Epub.js** di dalam komponen React.
- [ ] Membangun UI _viewer_ dasar (Navigasi halaman Next/Prev, daftar isi).
- [ ] Implementasi penyimpanan lokal (IndexedDB) agar buku yang sudah diunduh dari Storage tidak perlu diunduh ulang.

### Fase 3: Kustomisasi & Interaktivitas (Minggu 3)

- [ ] Membangun panel pengaturan tema (Ubah warna _background_, warna teks, jenis _font_, _line-height_) dll.
- [ ] Mengaitkan perubahan tema langsung ke instance Epub.js (`rendition.themes`).
- [ ] Menyimpan preferensi tema pengguna ke tabel `user_profiles` dan _local storage_.
- [ ] Diberikan pilihan ingin scroll horizontal atau vertikal. jika horizontal ada efek slide seperti dibuku asli (jika memungkinkan).
- [ ] Buat tampilan dengan warna yg tidak terlalu terang berikan warna yg nyaman untuk mata.

### Fase 4: Fitur Translasi (Minggu 4)

- [ ] Setup Route Handler di Next.js (`/api/translate`) untuk memanggil Google Translate API secara aman dari _server-side_.
- [ ] Menangkap _event text selection_ pada iframe Epub.js.
- [ ] Menampilkan _floating pop-up_ di dekat teks yang disorot dengan hasil terjemahan.

### Fase 5: PWA, Sinkronisasi & Finalisasi (Minggu 5)

- [ ] Konfigurasi Manifest dan Service Worker agar aplikasi bisa diinstal layaknya _native app_.
- [ ] Mengimplementasikan logika sinkronisasi _bookmark_: Simpan lokasi CFI (_Canonical Fragment Identifier_) ke IndexedDB saat membaca offline, dan _push_ ke Supabase saat online.
- [ ] Pengujian performa, _debugging_ UI/UX di _mobile_ dan _desktop_.

## 5. Pertimbangan Teknis Lanjutan

- **Keamanan API:** Pastikan _endpoint_ translasi internal (`/api/translate`) dilindungi oleh pengecekan sesi Supabase agar tidak di-_spam_ atau disalahgunakan oleh pihak luar.
- **State Management:** Pertimbangkan penggunaan Zustand untuk mengelola _state global_ seperti status buku yang sedang terbuka, posisi halaman, dan tema secara efisien.
