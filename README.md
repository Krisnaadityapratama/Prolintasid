# PROLINTAS Lead Management

Aplikasi CRM leads berbasis Next.js dan Supabase. Seluruh anggota yang masuk dapat melihat leads tim; hanya pembuat lead yang dapat mengubah atau menghapusnya. Admin Utama dapat membuat akun Admin dan Sales secara langsung.

## Menjalankan aplikasi

1. Gunakan Node.js 20.9 atau lebih baru.
2. Buat project Supabase, lalu jalankan SQL awal pada `supabase/migrations/202611110001_initial_crm.sql` melalui Supabase SQL Editor.
3. Salin `.env.example` menjadi `.env.local`, lalu isi URL project, anon key, service role key, dan email Admin Utama.
4. Di Supabase Authentication, buat akun awal dengan email yang sama dengan `SUPER_ADMIN_EMAIL`, lalu tetapkan kata sandi akun CRM di Supabase. Kata sandi Gmail tidak otomatis dapat dipakai untuk login email/kata sandi ini. Setelah masuk pertama kali, aplikasi menetapkan akun itu sebagai Admin Utama.
5. Setelah profil Admin Utama tersedia, jalankan SQL pada `supabase/migrations/202611110002_lead_options.sql` melalui Supabase SQL Editor. SQL ini membuat tabel pilihan, kebijakan akses, dan mengisi pilihan default. Untuk project yang sudah berjalan, cukup jalankan file migration kedua ini satu kali.
6. Untuk mengaktifkan tombol hapus pada menu **Pilihan Form**, jalankan `supabase/migrations/202611110003_delete_lead_options.sql` melalui Supabase SQL Editor.
7. Untuk mengaktifkan pembekuan akun dan pembatasan akses data bagi akun beku, jalankan `supabase/migrations/202611110004_freeze_users.sql` melalui Supabase SQL Editor.
8. Jalankan `npm install`, kemudian `npm run dev`.

Jangan gunakan service role key pada kode browser atau variabel yang diawali `NEXT_PUBLIC_`. Admin Utama membuat akun tim dari menu **Pengguna** menggunakan nama, email, role, dan kata sandi awal. Akun langsung aktif; bagikan kata sandi kepada anggota dengan aman dan minta mereka menggantinya setelah login.

## Hak akses

- **Admin Utama**: melihat seluruh leads, membuat pengguna ber-role Admin atau Sales, mengubah nama/kata sandi, membekukan/mengaktifkan akun, dan menghapus akun yang tidak memiliki leads.
- **Admin**: melihat seluruh leads, membuat leads, dan menambahkan pilihan form.
- **Sales**: melihat seluruh leads dan membuat leads.
- **Pembuat lead**: satu-satunya pengguna yang dapat mengubah atau menghapus lead yang dibuatnya.

Pembatasan baca dan tulis leads juga diberlakukan oleh Row Level Security Supabase, bukan hanya oleh antarmuka aplikasi.

Menu **Pilihan Form** mengelola industri, moda, layanan, sumber lead, satuan, incoterm, frekuensi, prospek, dan alasan lead gagal. Tahap pipeline sengaja tetap menjadi pilihan sistem agar laporan dan alur status tidak berubah.
