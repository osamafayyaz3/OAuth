const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: String,
    googleId: String,
    thumbnail: String,
    list: [{
        type: Schema.Types.ObjectId,
        ref: 'taskSchema'
    }]
})




const User = mongoose.model('userAuth', userSchema)

module.exports = User