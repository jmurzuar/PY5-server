const Venta = require('../models/Venta');

const obtenerVentas2 = async (req, res) => {
    try {
        const ventas = await Venta.find({});
        res.json({ ventas });
    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos",
            error
        });
    }
};

const crearVenta2 = async (req, res) => {
    const { usuario, monto } = req.body;
    try {
        const nuevaVenta = await Venta.create({ usuario, monto });
        res.json(nuevaVenta);
    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error creando la venta",
            error
        });
    }
};

module.exports = {
    obtenerVentas,
    crearVenta
};