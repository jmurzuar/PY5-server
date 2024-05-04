// 1. IMPORTACIONES
const mongoose = require('mongoose')

// 2. SCHEMA
const productoSchema = mongoose.Schema({
        nombre: {
            type: String, 
            required: true
            },
        precio: {
            type: Number,
            required: true
        },
        color: {
            type: String,
            required: true
        },
        descripcion: {
            type: String,
            required: true
        },
        detalles: {
            type: String,
            required: true
        },
        imagen: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

// 3. MODELO
const Producto = mongoose.model('Producto', productoSchema)

// 4. EXPORTACIÓN
module.exports = Producto