import Task from '../models/Task.js'
import Project from '../models/Project.js'

const addTask = async (req, res) => {
    const { project } = req.body

    try {
        // Check if project exists
        const projectExists = await Project.findById(project)

        if (!projectExists) {
            const error = new Error('Proyecto no encontrado')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the project creator
        if (projectExists.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        const storedTask = await Task.create(req.body)
        // Add task id to project tasks array
        projectExists.tasks.push(storedTask._id)
        await projectExists.save()

        res.status(201).json(storedTask)
    } catch {
        const error = new Error('Proyecto no encontrado')
        return res.status(404).json({ msg: error.message })
    }
}

const getTask = async (req, res) => {
    const { id } = req.params

    try {
        const task = await Task.findById(id).populate('project')

        // Check if task exists
        if (!task) {
            const error = new Error('Tarea no encontrada')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the task creator
        if (task.project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        res.status(200).json(task)
    } catch {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }
}

const updateTask = async (req, res) => {
    const { id } = req.params

    try {
        const task = await Task.findById(id)
            .populate('project')
            .populate('completedBy')

        // Check if task exists
        if (!task) {
            const error = new Error('Tarea no encontrada')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the task creator
        if (task.project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        task.name = req.body.name || task.name
        task.description = req.body.description || task.description
        task.priority = req.body.priority || task.priority
        task.deliveryDate = req.body.deliveryDate || task.deliveryDate

        const updatedTask = await task.save()
        res.status(200).json(updatedTask)
    } catch {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }
}

const deleteTask = async (req, res) => {
    const { id } = req.params

    try {
        const task = await Task.findById(id).populate('project')

        // Check if task exists
        if (!task) {
            const error = new Error('Tarea no encontrada')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the task creator
        if (task.project.creator.toString() !== req.user._id.toString()) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        const project = await Project.findById(task.project)
        project.tasks.pull(task._id)

        await Promise.allSettled([await project.save(), await task.deleteOne()])

        res.status(200).json({ msg: 'Tarea eliminada' })
    } catch {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }
}

const changeStatus = async (req, res) => {
    const { id } = req.params

    try {
        const task = await Task.findById(id).populate('project')

        // Check if task exists
        if (!task) {
            const error = new Error('Tarea no encontrada')
            return res.status(404).json({ msg: error.message })
        }

        // Check if user is the task creator or a collaborator
        if (
            task.project.creator.toString() !== req.user._id.toString() &&
            !task.project.collaborators.some(
                collaborator =>
                    collaborator._id.toString() === req.user._id.toString()
            )
        ) {
            const error = new Error('No tienes permisos sobre este proyecto')
            return res.status(403).json({ msg: error.message })
        }

        task.status = !task.status
        task.completedBy = req.user._id
        await task.save()
        res.status(200).json({
            ...task._doc,
            completedBy: { name: req.user.name },
        })
    } catch {
        const error = new Error('Tarea no encontrada')
        return res.status(404).json({ msg: error.message })
    }
}

export { addTask, getTask, updateTask, deleteTask, changeStatus }
