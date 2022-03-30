import nodemailer from 'nodemailer'
import {
    registrationEmailTemplate,
    forgotPasswordEmailTemplate,
} from './templates/email.js'

export const registrationEmail = async user => {
    const { name, email, token } = user

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    // Send email with confirmation token
    const info = await transport.sendMail({
        from: `"UpTask - Administrador de Proyectos" <cuentas@uptask.com>`,
        to: email,
        subject: 'UpTask - Confirma tu cuenta',
        text: 'Confirma tu cuenta en UpTask',
        html: registrationEmailTemplate(name, token),
    })
}

export const forgotPasswordEmail = async user => {
    const { name, email, token } = user

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    // Send email with confirmation token
    const info = await transport.sendMail({
        from: `"UpTask - Administrador de Proyectos" <cuentas@uptask.com>`,
        to: email,
        subject: 'UpTask - Restablecer contraseña',
        text: 'Restablece tu contraseña en UpTask',
        html: forgotPasswordEmailTemplate(name, token),
    })
}
