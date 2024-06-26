// 1. IMPORTACIONES
const express = require('express')
const app = express()
const cors = require('cors')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

const auth = require('./middleware/authorization')

const connectDB = require('./config/db')

const Guitarra = require('./models/Guitar')
const Usuario = require('./models/User')
const Producto = require('./models/Product')
const Venta = require('./models/Venta')



// 2. MIDDLEWARES
// VARIABLES DE ENTORNO
require('dotenv').config()

// CONEXIÓN A DB
connectDB()

// Habilitar CORS
const whitelist = ['http://localhost:3004/', 'http://localhost:3001/'];
app.use(cors(whitelist))

app.use(express.json());


// MERCADO PAGO

const mercadopago = require("mercadopago")
const { update } = require('./models/Guitar')

mercadopago.configure({
    access_token: process.env.PROD_ACCESS_TOKEN
})


// 3. RUTEO

// A. GUITARRAS

app.get("/obtener-guitarras", async (req, res) => {
    try {
        const guitarras = await Guitarra.find({})

        res.json({
            guitarras
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }
})

app.get("/obtener-guitarra/:id", async (req, res) => {

    const { id } = req.params

    try {

        const guitar = await Guitarra.findById(id)

        res.json({
            guitar
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }


})

app.post("/crear-guitarra", async (req, res) => {

    const {
        nombre,
        precio,
        imagen,
        descripcion,
        detalles,
        color } = req.body

    try {

        const nuevaGuitarra = await Guitarra.create({
            nombre, precio, imagen, descripcion,
            detalles, color
        })

        res.json(nuevaGuitarra)

    } catch (error) {

        res.status(500).json({
            msg: "Hubo un error creando la guitarra",
            error
        })

    }
})

app.put("/actualizar-guitarra", async (req, res) => {

    const { id, nombre, precio } = req.body

    try {
        const actualizacionGuitarra = await Guitarra.findByIdAndUpdate(id, { nombre, precio }, { new: true })

        res.json(actualizacionGuitarra)

    } catch (error) {

        res.status(500).json({
            msg: "Hubo un error actualizando la guitarra"
        })

    }


})

app.delete("/borrar-guitarra", async (req, res) => {

    const { id } = req.body

    try {

        const guitarraBorrada = await Guitarra.findByIdAndRemove({ _id: id })

        res.json(guitarraBorrada)


    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error borrando la guitarra especificada"
        })
    }

})

// B. USUARIOS
// CREAR UN USUARIO
app.post("/usuario/crear", async (req, res) => {

    // OBTENER USUARIO, EMAIL Y PASSWORD DE LA PETICIÓN
    const { name, email, password } = req.body

    try {
        // GENERAMOS FRAGMENTO ALEATORIO PARA USARSE CON EL PASSWORD
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        // CREAMOS UN USUARIO CON SU PASSWORD ENCRIPTADO
        const respuestaDB = await Usuario.create({
            name,
            email,
            password: hashedPassword
        })

        // USUARIO CREADO. VAMOS A CREAR EL JSON WEB TOKEN

        // 1. EL "PAYLOAD" SERÁ UN OBJETO QUE CONTENDRÁ EL ID DEL USUARIO ENCONTRADO EN BASE DE DATOS.
        // POR NINGÚN MOTIVO AGREGUES INFORMACIÓN CONFIDENCIAL DEL USUARIO (SU PASSWORD) EN EL PAYLOAD.
        const payload = {
            user: {
                id: respuestaDB._id
            }
        }

        // 2. FIRMAR EL JWT
        jwt.sign(
            payload, // DATOS QUE SE ACOMPAÑARÁN EN EL TOKEN
            process.env.SECRET, // LLAVE PARA DESCIFRAR LA FIRMA ELECTRÓNICA DEL TOKEN,
            {
                expiresIn: 360000 // EXPIRACIÓN DEL TOKEN
            },
            (error, token) => { // CALLBACK QUE, EN CASO DE QUE EXISTA UN ERROR, DEVUELVA EL TOKEN

                if (error) throw error

                res.json({
                    token
                })
            }
        )

    } catch (error) {

        return res.status(400).json({
            msg: error
        })

    }
})


// INICIAR SESIÓN
app.post("/usuario/iniciar-sesion", async (req, res) => {

    // OBTENEMOS EL EMAIL Y EL PASSWORD DE LA PETICIÓN
    const { email, password } = req.body

    try {
        // ENCONTRAMOS UN USUARIO
        let foundUser = await Usuario.findOne({ email })

        // SI NO HUBO UN USUARIO ENCONTRADO, DEVOLVEMOS UN ERROR
        if (!foundUser) {
            return res.status(400).json({ msg: "El usuario no existe" })
        }

        // SI TODO OK, HACEMOS LA EVALUACIÓN DE LA CONTRASEÑA ENVIADA CONTRA LA BASE DE DATOS
        const passCorrecto = await bcryptjs.compare(password, foundUser.password)

        // SI EL PASSWORD ES INCORRECTO, REGRESAMOS UN MENSAJE SOBRE ESTO
        if (!passCorrecto) {
            return await res.status(400).json({ msg: "Password incorrecto" })
        }

        // SI TODO CORRECTO, GENERAMOS UN JSON WEB TOKEN
        // 1. DATOS DE ACOMPAÑAMIENTO AL JWT
        const payload = {
            user: {
                id: foundUser.id
            }
        }

        // 2. FIRMA DEL JWT
        jwt.sign(
            payload,
            process.env.SECRET,
            {
                expiresIn: 3600000
            },
            (error, token) => {
                if (error) throw error;

                //SI TODO SUCEDIÓ CORRECTAMENTE, RETORNAR EL TOKEN
                res.json({ token })
            })

    } catch (error) {
        res.json({
            msg: "Hubo un error",
            error
        })
    }

})

// VERIFICAR USUARIO

// COMO OBSERVACIÓN, ESTAMOS EJECUTANDO EL MIDDLEWARE DE AUTH (AUTORIZACIÓN) ANTES DE ACCEDER
// A LA RUTA PRINCIPAL
app.get("/usuario/verificar-usuario", auth, async (req, res) => {

    try {
        // CONFIRMAMOS QUE EL USUARIO EXISTA EN BASE DE DATOS Y RETORNAMOS SUS DATOS, EXCLUYENDO EL PASSWORD
        const user = await Usuario.findById(req.user.id).select('-password')
        res.json({ user })

    } catch (error) {
        // EN CASO DE HERROR DEVOLVEMOS UN MENSAJE CON EL ERROR
        res.status(500).json({
            msg: "Hubo un error",
            error
        })
    }
})

// ACTUALIZAR USUARIO
app.put("/usuario/actualizar", auth, async (req, res) => {

    // CAPTURAMOS USUARIO DEL FORMULARIO
    const newDataForOurUser = req.body

    try {
        // LOCALIZAMOS EL USUARIO
        const updatedUser = await Usuario.findByIdAndUpdate(
            req.user.id,
            newDataForOurUser,
            { new: true }
        ).select("-password")

        res.json(updatedUser)


    } catch (error) {
        console.log(error)
        res.send(error)
    }
}
)




// C. CHECKOUT MERCADOPAGO


app.post("/mercadopago", async (req, res) => {
    
    const preference = req.body
    const responseMP = await mercadopago.preferences.create(preference)

    //console.log(responseMP)

    res.json({
        checkoutId: responseMP.body.id
    });

})


app.post("/mercadopago/notificacion", async (req, res) => {
    try {
      // Obtener los datos de la notificación de Mercado Pago
      const notificationData = req.body;
  
      // Verificar si la notificación indica que la transacción fue aprobada
      if (notificationData && notificationData.action === 'payment.approved') {
        // Limpiar el carrito
        console.log('Limpiar el carrito')
        limpiarCarrito();
  
        // Enviar respuesta exitosa a Mercado Pago
        res.sendStatus(200);
      } else {
        // Enviar respuesta no válida a Mercado Pago en caso de que la notificación no sea válida
        res.sendStatus(400);
      }
    } catch (error) {
      console.error('Error al procesar la notificación de Mercado Pago:', error);
      res.status(500).json({ error: 'Error al procesar la notificación' });
    }
  });
  
  // Función para limpiar el carrito
  function limpiarCarrito() {
    // Aquí va la lógica para limpiar el carrito, por ejemplo:
    carrito = [];
  }
  



// 4. SERVIDOR
app.listen(process.env.PORT, () => console.log("El servidor está funcionando correctamente"))



// 3. RUTEO-2

// A. PRODUCTOS

app.get("/obtener-productos", async (req, res) => {
    try {
        const productos = await Producto.find({})

        res.json({
            productos
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }
})


app.get('/obtener-ventas', async (req, res) => {
    const { email } = req.query;

    try {
        const ventas = await Venta.find({ usuario: email });
        res.json({ ventas });
        

    } catch (error) {

        res.status(500).json({ msg: "Hubo un error obteniendo los datos", error });
    }
});

app.post('/crear-ventas', async (req, res) => {
    const { usuario, monto, payment_id, merchant_order_id } = req.body;
    try {
        const nuevaVenta = await Venta.create({ usuario, monto, payment_id, merchant_order_id  });
        res.json(nuevaVenta);
    } catch (error) {
        res.status(500).json({ msg: "Hubo un error creando la venta", error });
    }
});

app.get("/obtener-ventas/:id", async (req, res) => {

    const { id } = req.params

    try {

        const venta = await Venta.findById(id)

        res.json({
            venta
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }


})