/*
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    path: { type: String, required: true }, // Ruta del archivo o ubicación física
    key: { type: String, required: true },  // Clave única asociada a la imagen
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
*/

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    path: { type: String, required: true },
    key: { type: String, required: true },
    clase: { type: String },         // ← NUEVO campo: persona / no persona
    confidence: { type: Number }     // ← NUEVO campo: porcentaje (ej: 97.23)
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
