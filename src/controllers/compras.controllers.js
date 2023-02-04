import Compra from '../models/Compra.js'
import bizSdk from 'facebook-nodejs-business-sdk'
import nodemailer from 'nodemailer'

export const createCompra = async (req, res) => {
    try {
        const {email, region, ciudad, nombre, apellido, direccion, departamento, telefono, cupon, carrito, envio, estado, pago, fecha, fbp, fbc} = req.body
        const phone = `56${telefono}`
        const CustomData = bizSdk.CustomData
        const EventRequest = bizSdk.EventRequest
        const UserData = bizSdk.UserData
        const ServerEvent = bizSdk.ServerEvent
        const access_token = process.env.APIFACEBOOK_TOKEN
        const pixel_id = process.env.APIFACEBOOK_PIXELID
        const api = bizSdk.FacebookAdsApi.init(access_token)
        let current_timestamp = new Date()
        const userData = (new UserData())
            .setFirstName(nombre.toLowerCase())
            .setLastName(apellido.toLowerCase())
            .setEmail(email.toLowerCase())
            .setPhone(phone)
            .setCity(ciudad.toLowerCase())
            .setCountry('cl')
            .setClientIpAddress(req.connection.remoteAddress)
            .setClientUserAgent(req.headers['user-agent'])
            .setFbp(fbp)
            .setFbc(fbc)
        let value
        if ( carrito.length ) {
            value = carrito.reduce((prev, current) => prev + (current.precio * current.cantidadProductos), 0)
        } else {
            value = carrito.precio * carrito.cantidadProductos
        }
        const customData = (new CustomData())
            .setCurrency('clp')
            .setValue(value)
        const serverEvent = (new ServerEvent())
            .setEventName('InitiateCheckout')
            .setEventTime(current_timestamp)
            .setUserData(userData)
            .setCustomData(customData)
            .setEventSourceUrl('https://blaspod.cl/finalizar')
            .setActionSource('website')
        const eventsData = [serverEvent]
        const eventRequest = (new EventRequest(access_token, pixel_id))
            .setEvents(eventsData)
            eventRequest.execute().then(
                response => {
                    console.log('Response: ', response)
                },
                err => {
                    console.error('Error: ', err)
                }
            )
        const cuponUpper = cupon.toUpperCase()
        const nuevaCompra = new Compra({email, region, ciudad, nombre, apellido, direccion, departamento, telefono, cupon: cuponUpper, carrito, envio, estado, pago, fecha})
        await nuevaCompra.save()
        return res.json(nuevaCompra)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}

export const getCompras = async (req, res) => {
    try {
        const compras = await Compra.find()
        res.send(compras)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}

export const getCompra = async (req, res) => {
    try {
        const compra = await Compra.findById(req.params.id)
        if (!compra) return res.sendStatus(404)
        res.json(compra)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}

export const updateCompra = async (req, res) => {
    try {
        const { compra, fbp, fbc } = req.body
        const updateCompra = await Compra.findByIdAndUpdate(req.params.id, compra, {new: true})
        if (req.body.estado === 'Pago realizado') {
            const CustomData = bizSdk.CustomData
            const EventRequest = bizSdk.EventRequest
            const UserData = bizSdk.UserData
            const ServerEvent = bizSdk.ServerEvent
            const access_token = process.env.APIFACEBOOK_TOKEN
            const pixel_id = process.env.APIFACEBOOK_PIXELID
            const api = bizSdk.FacebookAdsApi.init(access_token)
            let current_timestamp = new Date()
            const userData = (new UserData())
                .setFirstName(compra.nombre.toLowerCase())
                .setLastName(compra.apellido.toLowerCase())
                .setEmail(compra.email.toLowerCase())
                .setPhone(compra.phone)
                .setCity(compra.ciudad.toLowerCase())
                .setClientIpAddress(req.connection.remoteAddress)
                .setClientUserAgent(req.headers['user-agent'])
                .setFbp(fbp)
                .setFbc(fbc)
            let value
            if ( carrito.length ) {
                value = compra.carrito.reduce((prev, current) => prev + (current.precio * current.cantidadProductos), 0)
            } else {
                value = compra.carrito.precio * compra.carrito.cantidadProductos
            }
            const customData = (new CustomData())
                .setCurrency('clp')
                .setValue(value)
            const serverEvent = (new ServerEvent())
                .setEventName('Pucharse')
                .setEventTime(current_timestamp)
                .setUserData(userData)
                .setCustomData(customData)
                .setEventSourceUrl('https://blaspod.cl/gracias-por-comprar')
                .setActionSource('website')
            const eventsData = [serverEvent]
            const eventRequest = (new EventRequest(access_token, pixel_id))
                .setEvents(eventsData)
                eventRequest.execute().then(
                    response => {
                        console.log('Response: ', response)
                    },
                    err => {
                        console.error('Error: ', err)
                    }
                )
            async function main() {
                let transporter = nodemailer.createTransport({
                    host: "smtp.hostinger.com",
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'ayuda@blaspod.cl',
                        pass: 'Estevan5966@',
                    },
                })
                await transporter.sendMail({
                    from: '"Blaspod Store" <ayuda@blaspod.cl>',
                    to: compra.email,
                    subject: `¡${compra.nombre} Tu compra ha ha sido generada y pagada con exito!`,
                    html: `<div style="display: flex; margin: 20px;">
                        <div style="margin: auto; width: 600px;">
                            <div style="display: flex; border-bottom: 1px solid #caccd6; padding-bottom: 20px;">
                                <a style="margin: auto;" href="https://blaspod.cl/"><img src="https://res.cloudinary.com/blasspod/image/upload/v1664841659/blaspod/ouxxwsmqodpemvffqs7b.png" style="width: 270px;" /></a>
                            </div>
                            <div style="border-bottom: 1px solid #caccd6; padding-bottom: 30px;">
                                <h1 style="text-align: center; font-family: poppins, sans-serif; padding-bottom: 0px; font-weight: 500; font-size: 30px;">Te damos las gracias por confiar en nosotros</h1>
                                <p style="text-align: center; font-family: poppins, sans-serif; color: #000000; font-size: 16px; font-weight: 300; margin-bottom: 20px;">¡Hola ${compra.nombre}! Te queriamos comentar que tu compra ya ha sido generada y pagada con exito, cualquier actualización de tu pedido sera informado por este medio.</p>
                                <div style="display: flex;">
                                    <a style="margin: auto; background-color: #303237; color: #fff; padding: 8px 35px; border-radius: 5px; font-family: poppins, sans-serif; text-decoration: none; font-size: 16px;" href="https://blaspod.cl/#/contacto">Contactate con nosotros</a>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <div style="padding: 0px 5px; width: 50%;">
                                    <p style="font-family: poppins, sans-serif; font-size: 15px;">Blaspod Store</p>
                                    <p style="font-family: poppins, sans-serif; font-size: 15px;">ayuda@blaspod.cl</p>
                                    <p style="font-family: poppins, sans-serif; font-size: 15px;">+56996150056</p>
                                </div>
                                <div style="padding: 0px 5px; width: 50%; margin-top: 10px; text-align: end">
                                    <a style="font-family: poppins, sans-serif; font-size: 15px; display: block;" href="https://facebook.com/blaspod">Facebook</a>
                                    <a style="font-family: poppins, sans-serif; font-size: 15px; display: block;" href="https://instagram.com/blaspod">Instagram</a>
                                    <a style="font-family: poppins, sans-serif; font-size: 15px; display: block;" href="https://tiktok.com/@blaspod">TikTok</a>
                                    <a style="font-family: poppins, sans-serif; font-size: 15px; display: block;" href="https://wa.me/message/4H6Q4RGYT4FHK1">Whatsapp</a>
                                </div>
                            </div>
                        </div>
                    </div>`
                })
            }
            main().catch(console.error)
        }
        return res.send(updateCompra)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}