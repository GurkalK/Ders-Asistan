import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 16; // Son 16 mesaj (8 konuşma çifti)

app.use(cors());
app.use(express.json());

// ====================== SAĞLIK KONTROLÜ ======================
app.get('/', (req, res) => {
    res.json({
        status: "✅ Çalışıyor",
        message: "Ders Asistanı Backend API",
        model: "gemini-2.5-flash-lite",
        maxHistory: MAX_HISTORY,
        endpoints: { chat: "POST /api/chat" }
    });
});

app.get('/api/chat', (req, res) => {
    res.json({ message: "Bu endpoint sadece POST methodu ile çalışır." });
});

// ====================== ANA CHAT ENDPOINT ======================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-lite";
const SYSTEM_PROMPT = "Sen deneyimli, sabırlı ve ilham verici bir öğretmensin. Türkçe konuşan öğrencilere yardım ediyorsun. Her zaman Türkçe yanıt ver. Açıklamalarını net, anlaşılır ve motive edici tut. Gerektiğinde adım adım anlat, örneklerle destekle. Çok uzun olmamaya çalış; anlaşılır ve özlü ol.";

app.post('/api/chat', async (req, res) => {
    try {
        let { history } = req.body;

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: "History parametresi eksik veya hatalı" });
        }

        // =================== HISTORY SINIRLAMA ===================
        // En son mesajları tut, eskileri sil
        if (history.length > MAX_HISTORY) {
            history = history.slice(-MAX_HISTORY);
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: history
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Hatası:", data);
            return res.status(response.status).json({
                error: data?.error?.message || "Gemini API hatası"
            });
        }

        res.json(data);

    } catch (error) {
        console.error("Backend Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Ders Asistanı Backend ${PORT} portunda çalışıyor`);
    console.log(`📍 Maksimum sohbet geçmişi: ${MAX_HISTORY} mesaj`);
    console.log(`🔗 Test için: http://localhost:${PORT}`);
});