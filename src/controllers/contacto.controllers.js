import Contacto from '../models/Contacto.js'
import {uploadImage, deleteImage} from '../libs/cloudinary.js'
import fs from 'fs-extra'
import bizSdk from 'facebook-nodejs-business-sdk'

export const createMensaje = async (req, res) => {
    try {
        const {nombre, email, telefono, metodoRespuesta, mensaje, fbp, fbc} = req.body
        const phone = `56${telefono}`
        const EventRequest = bizSdk.EventRequest
        const UserData = bizSdk.UserData
        const ServerEvent = bizSdk.ServerEvent
        const access_token = process.env.APIFACEBOOK_TOKEN
        const pixel_id = process.env.APIFACEBOOK_PIXELID
        const api = bizSdk.FacebookAdsApi.init(access_token)
        let current_timestamp = new Date()
        const userData = (new UserData())
            .setFirstName(nombre.toLowerCase())
            .setEmail(email.toLowerCase())
            .setPhone(phone)
            .setClientIpAddress(req.connection.remoteAddress)
            .setClientUserAgent(req.headers['user-agent'])
            .setFbp(fbp)
            .setFbc(fbc)
        const serverEvent = (new ServerEvent())
            .setEventName('Lead')
            .setEventTime(current_timestamp)
            .setUserData(userData)
            .setEventSourceUrl('https://blaspod.cl/contacto')
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
        let imagen
        if (req.files?.imagen) {
            const result = await uploadImage(req.files.imagen.tempFilePath)
            await fs.remove(req.files.imagen.tempFilePath)
            imagen = {
                url: result.secure_url,
                public_id: result.public_id
            }
        }
        const fecha = new Date()
        const nuevoMensaje = new Contacto({nombre, email, telefono, metodoRespuesta, mensaje, imagen, fecha})
        await nuevoMensaje.save()
        return res.json(nuevoMensaje)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}

export const getMensajes = async (req, res) => {
    try {
        const mensajes = await Contacto.find()
        res.send(mensajes)
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
}