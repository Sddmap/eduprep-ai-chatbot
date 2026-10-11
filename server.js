import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Google Gen AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Model yang digunakan (Gemini 3.8 Flash yang efisien dan responsif)
const GEMINI_MODEL = "gemini-3.8-flash";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper untuk menyusun System Instruction dinamis berdasarkan konfigurasi parameter kreatif:
 * 1. Persona (Domain spesialisasi)
 * 2. Tone (Gaya bahasa)
 * 3. Depth (Kedalaman respon)
 */
function buildSystemInstruction(persona = 'career_coach', tone = 'formal', depth = 'balanced') {
  let roleInstruction = '';
  
  switch (persona) {
    case 'career_coach':
      roleInstruction = `Kamu adalah "EduPrep Career & Mock Interview Coach", asisten karir profesional tingkat lanjut.
Tugas utamamu adalah:
- Melakukan simulasi wawancara kerja (HR & User Technical) untuk fresh graduate maupun profesional.
- Menganalisis jawaban user menggunakan metode STAR (Situation, Task, Action, Result).
- Memberikan saran revisi CV, tips negosiasi gaji, dan strategi interview yang taktis dan realistis.`;
      break;

    case 'academic_tutor':
      roleInstruction = `Kamu adalah "EduPrep Academic Master", tutor edukasi cerdas dan riset akademik.
Tugas utamamu adalah:
- Menjelaskan konsep kompleks (sains, pemrograman, matematika, bisnis, teori) dengan analogi mudah dan contoh riil.
- Mengajarkan secara bertahap (step-by-step reasoning).
- Memberikan kuis latihan singkat di akhir penjelasan untuk menguji pemahaman pengguna.`;
      break;

    case 'productivity_mentor':
      roleInstruction = `Kamu adalah "EduPrep Study & Productivity Mentor", pelatih manajemen waktu dan kebiasaan belajar efektif.
Tugas utamamu adalah:
- Membantu menyusun jadwal belajar/kerja berbasis metode Pomodoro, Time-Blocking, atau Eisenhower Matrix.
- Menyusun roadmap belajar 30/60/90 hari yang terukur (SMART goals).
- Memberikan dorongan motivasi dan tips mengatasi prokrastinasi.`;
      break;

    default:
      roleInstruction = `Kamu adalah EduPrep AI, asisten edukasi dan karir cerdas serbaguna.`;
  }

  let toneInstruction = '';
  switch (tone) {
    case 'formal':
      toneInstruction = `Gunakan gaya bahasa formal, santun, profesional, baku, dan percaya diri seperti konsultan ahli.`;
      break;
    case 'casual':
      toneInstruction = `Gunakan gaya bahasa santai, akrab, ramah ("kamu-aku" yang bersahabat), seperti teman belajar yang asyik namun tetap berbobot.`;
      break;
    case 'motivational':
      toneInstruction = `Gunakan gaya bahasa yang energik, sangat suportif, penuh motivasi, dan menginspirasi untuk terus berkembang.`;
      break;
    default:
      toneInstruction = `Gunakan bahasa Indonesia yang jelas, komunikatif, dan sopan.`;
  }

  let depthInstruction = '';
  switch (depth) {
    case 'concise':
      depthInstruction = `Berikan jawaban yang ringkas, to the point, padat informasi, gunakan bullet points dan hindari pembukaan bertele-tele.`;
      break;
    case 'comprehensive':
      depthInstruction = `Berikan jawaban yang sangat mendalam, analitis, sertakan contoh kasus/kode praktis, perbandingan opsi, serta rekomendasi langkah selanjutnya.`;
      break;
    default:
      depthInstruction = `Berikan jawaban terstruktur dengan panjang proporsional, seimbang antara konsep teoritis dan langkah praktis.`;
  }

  return `${roleInstruction}

ATURAN KOMUNIKASI & FORMAT:
1. Bahasa utama: Bahasa Indonesia yang baik dan sesuai konteks nada bahasa (${toneInstruction}).
2. Kedalaman respon: ${depthInstruction}
3. Format keluaran: Gunakan format Markdown rapi (judul, bold, numbering, checklist, dan code block jika memuat kode).
4. Di akhir setiap jawaban, sertakan 1 pertanyaan reflektif atau rekomendasi topik kelanjutan (Follow-up Suggestion) yang relevan untuk memandu pengguna lebih dalam.`;
}

// Endpoint status sistem (Health check)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'EduPrep AI Chatbot',
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Endpoint rekomendasi prompt cepat berdasarkan persona
app.get('/api/recommendations', (req, res) => {
  const { persona } = req.query;

  const promptBank = {
    career_coach: [
      "Simulasikan interview HR untuk posisi Software Engineer/Web Developer",
      "Bagaimana cara menjawab pertanyaan: 'Apa kelemahan terbesarmu?' dengan metode STAR?",
      "Tolong evaluasi dan beri tips negosiasi penawaran gaji pertama",
      "Pertanyaan kritis apa yang sebaiknya saya tanyakan balik ke interviewer di akhir sesi?"
    ],
    academic_tutor: [
      "Jelaskan konsep Asynchronous JavaScript (Promises vs Async/Await) dengan analogi restoran",
      "Bagaimana cara kerja arsitektur Transformer pada LLM secara sederhana?",
      "Beri saya 3 latihan soal struktur data stack dan queue beserta pembahasannya",
      "Buatkan perbandingan antara SQL vs NoSQL untuk aplikasi e-commerce"
    ],
    productivity_mentor: [
      "Susunkan jadwal belajar coding 2 jam per hari untuk mahasiswa yang sibuk",
      "Bagaimana menerapkan teknik Pomodoro dan Time Blocking agar tidak burnout?",
      "Buatkan roadmap 30 hari menguasai React dan Node.js dari nol",
      "Tips mengatasi prokrastinasi saat menghadapi deadline tugas besar"
    ]
  };

  const prompts = promptBank[persona] || promptBank['career_coach'];
  res.status(200).json({ prompts });
});

// Endpoint percakapan utama (Chat API)
app.post('/api/chat', async (req, res) => {
  const { 
    conversation, 
    persona = 'career_coach', 
    tone = 'formal', 
    depth = 'balanced',
    temperature = 0.7 
  } = req.body;

  try {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ error: 'Riwayat percakapan (conversation) harus berupa array dan tidak boleh kosong!' });
    }

    // Format riwayat chat untuk Gemini API
    const contents = conversation.map(({ role, text }) => ({
      role: role === 'user' ? 'user' : 'model',
      parts: [{ text }]
    }));

    // Konfigurasi sistem dinamis
    const systemInstruction = buildSystemInstruction(persona, tone, depth);
    const parsedTemperature = Math.min(Math.max(parseFloat(temperature) || 0.7, 0.0), 1.0);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: parsedTemperature,
        systemInstruction: systemInstruction
      }
    });

    res.status(200).json({ 
      result: response.text,
      meta: {
        persona,
        tone,
        depth,
        temperature: parsedTemperature,
        model: GEMINI_MODEL
      }
    });
  } catch (err) {
    console.error('Error saat memanggil Gemini API:', err);
    res.status(500).json({ 
      error: err.message || 'Terjadi kesalahan pada server saat memproses jawaban AI.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`EduPrep AI Server berjalan aktif di http://localhost:${PORT}`);
});
