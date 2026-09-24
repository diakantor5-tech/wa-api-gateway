const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

let qrCodeData = '';
let clientStatus = 'Initializing...';

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

// Event saat QR Code digenerate
client.on('qr', (qr) => {
    qrCodeData = qr;
    clientStatus = 'Waiting for QR scan...';
    console.log('QR RECEIVED, silakan buka /qr di browser untuk scan ulang.');
});

// Event saat berhasil terhubung
client.on('ready', () => {
    qrCodeData = '';
    clientStatus = 'Connected';
    console.log('Client WhatsApp sudah siap dan terhubung!');
});

// Event jika autentikasi gagal / sesi rusak
client.on('auth_failure', (msg) => {
    clientStatus = 'Auth Failure: ' + msg;
    console.error('Autentikasi gagal:', msg);
});

// Event jika terputus (logout / koneksi terputus)
client.on('disconnected', (reason) => {
    clientStatus = 'Disconnected: ' + reason;
    console.log('WhatsApp terputus, alasan:', reason);
    
    // Hancurkan client yang lama lalu cobainisialisasi ulang
    client.destroy().then(() => {
        console.log('Memulai ulang client WhatsApp...');
        client.initialize().catch(err => console.log('Gagal re-inisialisasi:', err));
    });
});

// Endpoint untuk menampilkan QR code di browser secara rapi
app.get('/qr', async (req, res) => {
    if (!qrCodeData) {
        return res.send(`
            <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
                <h2>Status WhatsApp: ${clientStatus}</h2>
                <p>WhatsApp kemungkinan sudah terhubung atau sedang memuat ulang. Jika butuh scan baru, pastikan sesi dibersihkan.</p>
            </div>
        `);
    }
    try {
        const imageUrl = await qrcode.toDataURL(qrCodeData);
        res.send(`
            <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
                <h2>Scan QR Code WhatsApp</h2>
                <p>Status: ${clientStatus}</p>
                <img src="${imageUrl}" alt="QR Code" style="width:300px; height:300px;" />
            </div>
        `);
    } catch (err) {
        res.status(500).send('Gagal generate QR code.');
    }
});

// Endpoint untuk mengirim pesan
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ status: false, response: 'Nomor dan pesan wajib diisi!' });
    }

    // Format nomor (pastikan berakhiran @c.us)
    const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
        await client.sendMessage(formattedPhone, message);
        return res.status(200).json({ status: true, response: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error('Gagal kirim pesan:', error);
        return res.status(500).json({ status: false, response: 'Gagal mengirim pesan. Pastikan WA terhubung.' });
    }
});

// ==========================================
// ENDPOINT BARU: Kirim Gambar / File (Media)
// ==========================================
app.post('/send-media', async (req, res) => {
    const { phone, url, caption } = req.body;

    if (!phone || !url) {
        return res.status(400).json({ status: false, response: 'Nomor dan URL file/gambar wajib diisi!' });
    }

    const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    try {
        // Mengambil media secara otomatis dari URL publik (bisa link gambar, PDF, dll)
        const media = await MessageMedia.fromUrl(url);

        // Kirim media beserta caption (opsional)
        await client.sendMessage(formattedPhone, media, { caption: caption || '' });

        return res.status(200).json({ status: true, response: 'File/Gambar berhasil dikirim!'});
    } catch (error) {
        console.error('Gagal kirim media:', error);
        return res.status(500).json({ status: false, response: 'Gagal mengirim file/gambar.' , error_detail: error.message});
    }
});

// Jalankan inisialisasi client dengan penanganan error agar tidak crash total
client.initialize().catch(err => {
    console.error('Error saat inisialisasi awal client:', err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server API berjalan di port ${PORT}`);
});