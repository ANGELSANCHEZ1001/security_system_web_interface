const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const mongoose = require("mongoose");
const http = require('http');  // Nuevo: Servidor HTTP
const { Server } = require("socket.io"); // Nuevo: WebSockets
const Image = require('./models/image.js');

// Conexión a MongoDB
mongoose.connect('mongodb://143.198.171.247:27017/imageDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ Conectado a MongoDB");
}).catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
});

app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, './web')));

// Servidor HTTP
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Permitir conexiones desde cualquier dominio (ajusta según sea necesario)
        methods: ["GET", "POST"]
    }
});

// Evento de conexión de WebSockets
io.on('connection', (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on('disconnect', () => {
        console.log("🔴 Cliente desconectado:", socket.id);
    });
});

// Rutas de las páginas HTML
app.get('/ventana', (req, res) => res.sendFile(path.join(__dirname, './web/home.html')));
app.get('/historico', (req, res) => res.sendFile(path.join(__dirname, './web/historico.html')));
app.get('/fotos', (req, res) => res.sendFile(path.join(__dirname, './web/fotos.html')));
app.get('/fotos/:key', (req, res) => res.redirect(`/fotos.html?key=${req.params.key}`));



// Rutas de imágenes en MongoDB
app.get('/images', async (req, res) => {
    try {
        const images = await Image.find();
        res.json(images);
    } catch (error) {
        console.error('❌ Error al obtener imágenes:', error);
        res.status(500).json({ error: 'Error al obtener imágenes' });
    }
});

app.get('/images/:key', async (req, res) => {
    try {
        const images = await Image.find({ key: req.params.key });
        res.json(images);
    } catch (error) {
        console.error('❌ Error al obtener imágenes:', error);
        res.status(500).json({ error: 'Error al obtener imágenes' });
    }
});

// Ruta para agregar una nueva imagen con WebSockets
app.post('/images', async (req, res) => {
    const { title, url, key } = req.body;
    if (!title || !url || !key) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    try {
        const newImage = new Image({ title, url, key });
        await newImage.save();

        // Emitir evento WebSocket a todos los clientes conectados
        io.emit('new_image', { title, url, key });

        res.status(201).json({ message: 'Imagen agregada correctamente' });
    } catch (error) {
        console.error('❌ Error al agregar la imagen:', error);
        res.status(500).json({ error: 'Error al agregar la imagen' });
    }
});

// Puerto del servidor con WebSockets
const port = 4321;
server.listen(port, () => console.log(`🚀 Servidor en http://localhost:${port}`));
