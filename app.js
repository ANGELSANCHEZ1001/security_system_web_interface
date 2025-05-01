const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const mongoose = require("mongoose");
const Image = require('./models/image.js');
const http = require('http');
const { Server } = require("socket.io");

const PORT = 4321;
const MONGO_URI = 'mongodb://admin:Passw0rd_1@localhost:27017/imageDB?authSource=admin';

// Servidor HTTP y WebSocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Conexión WebSocket
io.on('connection', (socket) => {
  console.log("Cliente conectado:", socket.id);
  socket.on('disconnect', () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './web')));

// HTML routes
app.get('/ventana', (req, res) => res.sendFile(path.join(__dirname, './web/home.html')));
app.get('/historico', (req, res) => res.sendFile(path.join(__dirname, './web/historico.html')));
app.get('/fotos', (req, res) => res.sendFile(path.join(__dirname, './web/fotos.html')));
app.get('/fotos/:key', (req, res) => res.redirect(`/fotos.html?key=${req.params.key}`));

// API para verificar estado de Mongo
app.get('/status', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  let estado = "Desconectado";
  if (mongoState === 1) estado = "Conectado";
  else if (mongoState === 2) estado = "Conectando";
  else if (mongoState === 3) estado = "Desconectando";
  res.json({
    mongo: estado,
    estadoRaw: mongoState,
    timestamp: new Date().toISOString()
  });
});

// API de imagenes
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (error) {
    console.error('Error al obtener imagenes:', error);
    res.status(500).json({ error: 'Error al obtener imagenes' });
  }
});

app.get('/images/:key', async (req, res) => {
  try {
    const images = await Image.find({ key: req.params.key });
    res.json(images);
  } catch (error) {
    console.error('Error al obtener imagenes:', error);
    res.status(500).json({ error: 'Error al obtener imagenes' });
  }
});

app.post('/images', async (req, res) => {
  const { title, url, key } = req.body;
  if (!title || !url || !key) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  try {
    const newImage = new Image({ title, url, key });
    await newImage.save();

    // Emitir evento WebSocket
    io.emit('new_image', { title, url, key });

    res.status(201).json({ message: 'Imagen agregada correctamente' });
  } catch (error) {
    console.error('Error al agregar la imagen:', error);
    res.status(500).json({ error: 'Error al agregar la imagen' });
  }
});

// Conectar a Mongo y arrancar servidor
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Conectado a MongoDB");
    server.listen(PORT, () => {
      console.log(`Servidor en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error conectando a MongoDB:", err);
  });
