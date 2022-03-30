import User from '../models/User.js'
import generateId from '../helpers/generateId.js'
import generateJWT from '../helpers/generateJWT.js'
import { forgotPasswordEmail, registrationEmail } from '../helpers/emails.js'

const register = async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })

    // Avoid duplicated users
    if (user) {
        const error = new Error('Usuario ya registrado')
        return res.status(400).json({ msg: error.message })
    }

    try {
        const user = new User(req.body)
        user.token = generateId()
        await user.save()

        // Send email with confirmation token
        registrationEmail({
            email: user.email,
            name: user.name,
            token: user.token,
        })

        res.status(201).json({
            msg: 'Usuario registrado correctamente, revisa tu email para confirmar tu cuenta',
        })
    } catch (error) {
        console.error(error.message)
    }
}

const authenticate = async (req, res) => {
    // Check if user exists
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
        const error = new Error('Usuario no registrado')
        return res.status(404).json({ msg: error.message })
    }

    // Check if user is confirmed
    if (!user.confirmed) {
        const error = new Error('Tu cuenta no ha sido confirmada')
        return res.status(403).json({ msg: error.message })
    }

    // Check if password is correct
    if (await user.checkPassword(password)) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateJWT(user._id),
        })
    } else {
        const error = new Error('Contraseña incorrecta')
        return res.status(403).json({ msg: error.message })
    }
}

const confirm = async (req, res) => {
    const { token } = req.params

    // Check if token is valid
    const userToConfirm = await User.findOne({ token })
    if (!userToConfirm) {
        const error = new Error('Token inválido')
        return res.status(403).json({ msg: error.message })
    }

    try {
        userToConfirm.confirmed = true
        userToConfirm.token = ''
        await userToConfirm.save()
        res.status(200).json({ msg: 'Usuario confirmado correctamente' })
    } catch (error) {
        console.error(error.message)
    }
}

const forgotPassword = async (req, res) => {
    const { email } = req.body

    // Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
        const error = new Error('Usuario no registrado')
        return res.status(404).json({ msg: error.message })
    }

    try {
        user.token = generateId()
        await user.save()

        // Send email with confirmation token
        forgotPasswordEmail({
            email: user.email,
            name: user.name,
            token: user.token,
        })

        res.status(200).json({
            msg: 'Se te ha enviado un correo para restablecer la contraseña',
        })
    } catch (error) {
        console.error(error.message)
    }
}

const checkToken = async (req, res) => {
    const { token } = req.params

    // Check if token is valid
    const validToken = await User.findOne({ token })
    if (validToken) {
        res.status(200).json({ msg: 'Token válido' })
    } else {
        const error = new Error('Token inválido')
        return res.status(403).json({ msg: error.message })
    }
}

const newPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({ token })
    if (user) {
        user.password = password
        user.token = ''
        try {
            await user.save()
            res.status(200).json({
                msg: 'Contraseña actualizada correctamente',
            })
        } catch (error) {
            console.error(error.message)
        }
    } else {
        // Invalid token
        const error = new Error('Token inválido')
        return res.status(403).json({ msg: error.message })
    }
}

const profile = async (req, res) => {
    const { user } = req
    res.status(200).json(user)
}

export {
    register,
    authenticate,
    confirm,
    forgotPassword,
    checkToken,
    newPassword,
    profile,
}
