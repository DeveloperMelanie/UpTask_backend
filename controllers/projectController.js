import Project from '../models/Project.js'
import User from '../models/User.js'

const getProjects = async (req, res) => {
    const projects = await Project.find({
        $or: [
            { creator: { $in: req.user } },
            { collaborators: { $in: req.user } },
        ],
    })
        .sort({ createdAt: -1 })
        .select('-tasks')
        .select('-collaborators')
    res.status(200).json(projects)
}

const getProject = async (req, res) => {
    const { id } = req.params

    try {
        // Get project and sort tasks by date
        const project = await Project.findById(id)
            .populate({
                path: 'tasks',
                populate: { path: 'completedBy', select: 'name' },
                options: { sort: { createdAt: -1 } },
            })
            .populate('collaborators', 'name email')

        // Check if project exists
        if (!project) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator or collaborator
        if (
            project.creator.toString() !== req.user._id.toString() &&
            !project.collaborators.some(
                collaborator =>
                    collaborator._id.toString() === req.user._id.toString()
            )
        ) {
            const error = new Error('No tienes permiso para ver este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        res.status(200).json(project)
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

const createProject = async (req, res) => {
    const project = new Project(req.body)
    project.creator = req.user._id

    try {
        const storedProject = await project.save()
        res.status(201).json(storedProject)
    } catch (error) {
        console.error(error.message)
    }
}

const updateProject = async (req, res) => {
    const { id } = req.params

    try {
        const project = await Project.findById(id)

        // Check if project exists
        if (!project) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permiso para ver este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        project.name = req.body.name || project.name
        project.description = req.body.description || project.description
        project.deliveryDate = req.body.deliveryDate || project.deliveryDate
        project.client = req.body.client || project.client

        const updatedProject = await project.save()
        res.status(200).json(updatedProject)
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

const deleteProject = async (req, res) => {
    const { id } = req.params

    try {
        const project = await Project.findById(id)

        // Check if project exists
        if (!project) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permiso para ver este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        await project.deleteOne()
        res.status(200).json({ msg: 'Proyecto eliminado' })
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

const searchCollaborator = async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email }).select(
        '-confirmed -createdAt -password -token -updatedAt -__v'
    )

    if (!user) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({ msg: error.message })
    }

    res.status(200).json(user)
}

const addCollaborator = async (req, res) => {
    const { id } = req.params

    try {
        const project = await Project.findById(id)

        // Check if project exists
        if (!project) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        const { email } = req.body
        const user = await User.findOne({ email }).select(
            '-confirmed -createdAt -password -token -updatedAt -__v'
        )

        // Check if user exists
        if (!user) {
            const error = new Error('Usuario no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (user._id.toString() === project.creator.toString()) {
            const error = new Error('No puedes agregarte a ti mismo')
            return res.status(403).json({ msg: error.message })
        }

        // Check if user is already a collaborator
        if (project.collaborators.includes(user._id)) {
            const error = new Error('El usuario ya es colaborador')
            return res.status(403).json({ msg: error.message })
        }

        project.collaborators.push(user._id)
        await project.save()
        res.status(200).json({ msg: 'Colaborador agregado correctamente' })
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

const removeCollaborator = async (req, res) => {
    const { id } = req.params

    try {
        const project = await Project.findById(id)

        // Check if project exists
        if (!project) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        project.collaborators.pull(req.body.id)
        await project.save()
        res.status(200).json({ msg: 'Colaborador eliminado correctamente' })
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

export {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    searchCollaborator,
    addCollaborator,
    removeCollaborator,
}
