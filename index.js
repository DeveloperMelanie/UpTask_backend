import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

import connectDB from './config/db.js'

import userRoutes from './routes/userRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const app = express()

app.use(express.json())
dotenv.config()
connectDB()

// CORS
const whitelist = [process.env.FRONTEND_URL]
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
}

app.use(cors(corsOptions))

// Routes
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)

const PORT = process.env.PORT || 4000

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// Socket.io
import { Server } from 'socket.io'

const io = new Server(server, {
    pingTimeout: 60000,
})

io.on('connection', socket => {
    // Events
    socket.on('join', projectId => {
        socket.join(projectId)
    })

    socket.on('new-task', task => {
        const project = task.project
        io.to(project).emit('task-added', task)
    })

    socket.on('edit-task', task => {
        const project = task.project._id
        io.to(project).emit('task-edited', task)
    })

    socket.on('delete-task', task => {
        const project = task.project?._id || task.project
        io.to(project).emit('task-deleted', task)
    })

    socket.on('change-task-status', task => {
        const project = task.project._id
        io.to(project).emit('task-status-changed', task)
    })
})
