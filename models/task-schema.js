const mongoose = require('mongoose')
const Schema = mongoose.Schema

const taskSchema = new Schema({
    title: {
        type: String
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'userSchema'
    }
})

const Task = mongoose.model('task', taskSchema)
module.exports = Task