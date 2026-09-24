const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode'); // Tambahkan library qrcode

const app = express();
app.use(express.json());

let qrCodeData = ''; // Variabel untuk menyimpan data QR terbaru

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
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
    // Simpan string QR code saat event muncul
    qrCodeData = qr;
    console.log('QR RECEIVED, silakan buka /qr di browser untuk scan.');
});

client.on('ready', () => {
    console.log('Client WhatsApp sudah siap!');
    qrCodeData = ''; // Hapus QR jika sudah terhubung
});

// Route baru untuk menampilkan QR code dalam bentuk gambar asli di browser
app.get('/qr', async (req, res) => {
    if (!qrCodeData) {
        return res.send('<h3>WhatsApp sudah terhubung atau QR belum digenerate. Cek ulang log server.</h3>');
    }
    try {
        // Render QR code sebagai gambar PNG di browser
        const imageUrl = await qrcode.toDataURL(qrCodeData);
        res.send(`<div style="text-align:center; margin-top:50px;">
            <h2>Scan QR Code WhatsApp</h2>
            <img src="${imageUrl}" alt="QR Code" style="width:300px; height:300px;" />
        </div>`);
    } catch (err) {
        res.status(500).send('Gagal generate QR code.');
    }
});

// Endpoint kirim pesan Anda yang sudah ada...
app.post('/send-message', async (req, res) => {
    // ... logika kirim pesan ...
});

client.initialize();

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});