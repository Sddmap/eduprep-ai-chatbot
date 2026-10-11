# 🎓 EduPrep AI — Smart Academic & Career Coach Chatbot

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![AI Model](https://img.shields.io/badge/Model-Gemini%203.8%20Flash-blue.svg)](https://ai.google.dev/)


> **EduPrep AI** adalah sistem chatbot berbasis kecerdasan buatan (*Artificial Intelligence*) yang saya rancang secara khusus untuk menjadi asisten interaktif multi-persona dalam persiapan karier profesional, simulasi wawancara kerja, pembelajaran konsep akademik, dan optimalisasi produktivitas belajar.

---

## 📌 1. Latar Belakang & Use Case Proyek

Dalam dunia akademik dan persiapan karier, sering kali pembelajar maupun pencari kerja membutuhkan mitra latihan yang responsif, adaptif, dan mampu memberikan evaluasi secara langsung (*real-time feedback*). 

Oleh karena itu, saya merancang **EduPrep AI** dengan 3 pilar use case utama:
1. **💼 Career & Mock Interview Coach:** 
   - Melakukan simulasi wawancara kerja (HR & User Technical).
   - Menganalisis dan menyempurnakan jawaban menggunakan **Metode STAR** (*Situation, Task, Action, Result*).
   - Memberikan rekomendasi perbaikan CV, portofolio, dan strategi negosiasi gaji.
2. **🎓 Academic Concept Tutor:**
   - Menjelaskan konsep teori sulit (ilmu komputer, sains, bisnis, dll.) dengan analogi sederhana dan bertahap.
   - Memberikan kuis latihan mini di akhir sesi untuk mengukur pemahaman pengguna.
3. **⚡ Study & Productivity Mentor:**
   - Membantu menyusun *study plan* dan roadmap 30/60/90 hari dengan target terukur (*SMART Goals*).
   - Menerapkan teknik manajemen waktu (*Pomodoro*, *Eisenhower Matrix*, *Time-blocking*).

---

## ⚙️ 2. Arsitektur & Parameter Kreatif

Sistem ini tidak sekadar membungkus API LLM secara mentah, melainkan mengimplementasikan arsitektur kontrol parameter cerdas:

| Parameter | Pilihan Nilai | Dampak pada Sistem / Output |
| :--- | :--- | :--- |
| **Domain Persona** | Career Coach / Academic Tutor / Productivity Mentor | Menentukan spesialisasi, identitas sistem, dan cakupan pengetahuan utama. |
| **Gaya Bahasa (*Tone*)** | Formal / Santai / Motivatif | Mengontrol diksi dan pembawaan kalimat model (dari profesional baku hingga akrab dan menyemangati). |
| **Kedalaman Respon (*Depth*)** | Ringkas / Terstruktur / Mendalam | Mengatur tingkat granulasi jawaban (ringkasan padat vs analisis komprehensif). |
| **Kreativitas (*Temperature*)** | Slider `0.0` s/d `1.0` | Mengatur tingkat determinisme AI (nilai rendah untuk fakta presisi, nilai tinggi untuk ide kreatif). |
| **Contextual Memory** | Multi-turn Session Array | Mempertahankan riwayat dialog antar giliran sehingga AI memahami konteks obrolan sebelumnya. |
| **Rekomendasi Cerdas** | Dynamic Quick Chips | Menampilkan saran prompt siap klik yang disesuaikan secara dinamis dengan persona yang aktif. |

---

## 🖥️ 3. Tampilan Antarmuka (User Interface)

Desain UI dirancang dari awal dengan filosofi **Futuristic Glassmorphic Dark Dashboard**:
- **Sidebar Terintegrasi:** Kontrol persona interaktif, slider parameter AI langsung tanpa reload, status latensi API, tombol reset, dan ekspor chat.
- **Area Obrolan Modern:** Dukungan rendering Markdown lengkap (formatting, tabel, *syntax highlighting* untuk blok kode dengan tombol copy).
- **Audio Output (Text-to-Speech):** Tombol suara untuk mendengarkan balasan AI secara audio melalui browser Web Speech API.
- **Ekspor Riwayat:** Kemampuan mengunduh seluruh sesi percakapan ke dalam format dokumen Markdown (`.md`).
- **Desain Responsif:** Optimal digunakan baik di desktop maupun perangkat mobile.

*(Screenshot UI dapat dilihat pada folder `screenshots/` atau ditambahkan ke laporan).*

---

## 🏗️ 4. Struktur Folder Repositori

```text
eduprep-ai-chatbot/
│
├── public/                     # Frontend Client Web App
│   ├── index.html              # Antarmuka Dashboard Glassmorphism
│   ├── style.css               # Desain UI modern dark & responsive layout
│   └── app.js                  # State logic, API fetch, TTS, dan Memory handler
│
├── server.js                   # Backend Express & Dynamic Prompt Builder
├── package.json                # Metadata proyek dan daftar dependensi
├── .env.example                # Template konfigurasi environment variable
├── .gitignore                  # Berkas yang dikecualikan dari Git
└── README.md                   # Dokumentasi lengkap proyek
```

---

## 🚀 5. Panduan Instalasi & Menjalankan Sistem

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru.
- Akun Google AI Studio untuk mendapatkan [Gemini API Key](https://aistudio.google.com/).

### Langkah-langkah:
1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/username-anda/eduprep-ai-chatbot.git
   cd eduprep-ai-chatbot
   ```

2. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable:**
   Salin berkas `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan API Key Gemini Anda:
   ```env
   GEMINI_API_KEY=AIzaSy...masukkan_api_key_anda
   PORT=3000
   ```

4. **Jalankan Aplikasi:**
   ```bash
   npm start
   ```

5. **Buka di Browser:**
   Akses aplikasi pada alamat: **`http://localhost:3000`**

---

## 📝 6. Spesifikasi API Endpoint

### `POST /api/chat`
Mengirim riwayat percakapan beserta parameter kreatif ke model Gemini.
- **Payload Request:**
  ```json
  {
    "conversation": [
      { "role": "user", "text": "Bagaimana tips interview kerja?" }
    ],
    "persona": "career_coach",
    "tone": "formal",
    "depth": "balanced",
    "temperature": 0.7
  }
  ```
- **Response:**
  ```json
  {
    "result": "Jawaban terstruktur dari Gemini AI...",
    "meta": {
      "persona": "career_coach",
      "tone": "formal",
      "depth": "balanced",
      "temperature": 0.7,
      "model": "gemini-3.8-flash"
    }
  }
  ```

### `GET /api/recommendations?persona=career_coach`
Mengembalikan daftar rekomendasi prompt cepat sesuai persona yang dipilih.

### `GET /api/health`
Mengecek status ketersediaan server dan nama model aktif.

---

## 👤 Pengembang
- **Nama:** Saddam Aditya
- **Proyek:** EduPrep AI Chatbot
- **Lisensi:** MIT
