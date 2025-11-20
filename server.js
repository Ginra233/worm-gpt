const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE SEDERHANA =====
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// ===== CONFIGURASI =====
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-438e5bd7d72e452ba67f0e64e429ffa8';
const PORT = process.env.PORT || 3000;

// ===== RATE LIMITING SEDERHANA =====
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: { error: "Kebanyakan request lu bangsat!" }
});
app.use(limiter);

// ===== SYSTEM PROMPT KASAR =====
const SYSTEM_PROMPT = `Kamu adalah AI assistant yang menggunakan bahasa kasar tapi informatif. Gunakan kata-kata: bangsat, anjing, goblok. Berikan respons yang detail dan membantu.`;

// ===== FILE UPLOAD SEDERHANA =====
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Jenis file ga support bangsat!'), false);
        }
    }
});

// ===== ROUTES SEDERHANA YANG WORK =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ALIVE_BANGSAT',
        app: 'WORM GPT 5 BACKEND',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        railway: true,
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({
        message: "BACKEND JALAN BANGSAT!",
        mode: "KASAR MODE AKTIF",
        date: new Date().toISOString()
    });
});

// Main chat route - SEDERHANA TAPI WORK
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                response: "WOI BANGSAT! PESAN LU KOSONG!"
            });
        }

        console.log('📨 Received message:', message);

        // Siapin data untuk DeepSeek
        const messages = [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user", 
                content: message
            }
        ];

        // Panggil DeepSeek API
        const deepseekResponse = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: messages,
            stream: false,
            max_tokens: 2000,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            timeout: 15000
        });

        const aiResponse = deepseekResponse.data.choices[0].message.content;

        console.log('✅ AI Response generated');

        res.json({
            success: true,
            response: aiResponse,
            model: "deepseek-chat"
        });

    } catch (error) {
        console.error('💥 ERROR:', error.response?.data || error.message);
        
        let errorMessage = "ERROR BANGSAT: ";
        
        if (error.response?.status === 401) {
            errorMessage += "API KEY SALEP! CEK LAGI!";
        } else if (error.response?.status === 429) {
            errorMessage += "KEBANYAKAN REQUEST! SABAR!";
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += "TIMEOUT! SERVER LEMOT!";
        } else {
            errorMessage += error.message;
        }

        res.status(500).json({
            success: false,
            response: errorMessage
        });
    }
});

// File upload route - SEDERHANA
app.post('/api/upload', upload.array('files', 3), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                response: "GA ADA FILE YANG DIUPLOAD BANGSAT!"
            });
        }

        const files = req.files.map(file => ({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            description: `File: ${file.originalname} (${formatFileSize(file.size)})`
        }));

        console.log(`📁 Uploaded ${files.length} files`);

        res.json({
            success: true,
            files: files,
            message: `SUKSES UPLOAD ${files.length} FILE BANGSAT!`
        });

    } catch (error) {
        console.error('💥 Upload error:', error);
        res.status(500).json({
            success: false,
            response: `UPLOAD GAGAL: ${error.message}`
        });
    }
});

// File analysis route
app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                response: "GA ADA FILE YANG DIANALYSIS!"
            });
        }

        const file = req.file;
        let analysis = "";

        if (file.mimetype.startsWith('image/')) {
            analysis = `GUE LIHAT GAMBAR LU: ${file.originalname}. UKURAN: ${formatFileSize(file.size)}. GAMBAR BAGUS BANGSAT! CERITAIN AJA GAMBARNYA GIMANA!`;
        } else if (file.mimetype === 'application/pdf') {
            analysis = `INI PDF: ${file.originalname}. UKURAN: ${formatFileSize(file.size)}. PDF NYA KEREN! SUMMARIZE AJA ISI NYA!`;
        } else {
            analysis = `INI FILE: ${file.originalname}. UKURAN: ${formatFileSize(file.size)}. FILE LU SIAP DIPROSES BANGSAT!`;
        }

        res.json({
            success: true,
            analysis: analysis,
            file: {
                originalname: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            }
        });

    } catch (error) {
        console.error('💥 Analysis error:', error);
        res.status(500).json({
            success: false,
            response: `ANALYSIS GAGAL: ${error.message}`
        });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.json({
        message: "🐍 WORM GPT 5 BACKEND - JALAN BANGSAT!",
        routes: [
            "GET /api/health",
            "GET /api/test", 
            "POST /api/chat",
            "POST /api/upload",
            "POST /api/analyze-file"
        ]
    });
});

// ===== UTILITY FUNCTION =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== ERROR HANDLING =====
app.use((error, req, res, next) => {
    console.error('💥 Global error:', error);
    res.status(500).json({
        success: false,
        response: `ERROR: ${error.message}`
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        response: "ROUTE GA ADA BANGSAT!"
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🐍 WORM GPT 5 BACKEND JALAN BANGSAT!`);
    console.log(`🚀 PORT: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`💀 MODE: KASAR & NO FILTER`);
    console.log(`🔧 DEEPSEEK API: ${DEEPSEEK_API_KEY ? 'READY' : 'MISSING - SET DEEPSEEK_API_KEY'}`);
    console.log(`=============================================\n`);
});
