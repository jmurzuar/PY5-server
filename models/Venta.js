// 1. IMPORTACIONES
const mongoose = require('mongoose');

// 2. SCHEMA
const ventaSchema = new mongoose.Schema(
    {
        usuario: {
            type: String, 
            required: true
        },
        monto: {
            type: Number,
            required: true
        },
        payment_id: {
            type: Number,
            required: true
        },
        merchant_order_id: {
            type: Number,
            required: true
        },
    },
    {
        timestamps: true
    }
);

// 3. MODELO
const Venta = mongoose.model('Venta', ventaSchema);

// 4. EXPORTACIÓN
module.exports = Venta;