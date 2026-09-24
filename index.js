const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

// Inisialisasi client WhatsApp dengan LocalAuth agar sesi tersimpan
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, // Menjalankan browser di background tanpa GUI
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('SCAN QR CODE DI BAWAH INI:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client WhatsApp sudah siap dan terhubung!');
});

client.initialize();

// Endpoint API untuk mengirim pesan
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    try {
        // Format nomor WhatsApp (contoh: 628123456789@c.us)
        const chatId = `${phone}@c.us`;
        
        await client.sendMessage(chatId, message);

        res.status(200).json({
            status: true,
            response: 'Pesan berhasil dikirim!'
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            response: 'Gagal mengirim pesan',
            error: error.message
        });
    }
});

// Endpoint untuk menampilkan info Thunder Client
app.get('/thunder-info', (req, res) => {
    res.status(200).json({
        "message": "Welcome to Thunder Client",
        "about": "Lightweight Rest API Client for VSCode",
        "createdBy": "Ranga Vadhineni",
        "launched": 2021,
        "features": {
            "git": "Save data to Git Workspace",
            "themes": "Supports VSCode Themes",
            "data": "Collections & Environment Variables",
            "testing": "Scriptless Testing",
            "local": "Local Storage & Works Offline"
        },
        "supports": {
            "graphql": true,
            "codeSnippet": true,
            "requestChaining": true,
            "scripting": true
        }
    });
});

app.listen(3000, () => {
    console.log('Server API berjalan di http://localhost:3000');
});