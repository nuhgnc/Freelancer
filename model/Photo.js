const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    name: String,
    detail: String,
    photoPath: String,
    createdAt: { type: Date, default: Date.now}
})

const photo = mongoose.model('photo',photoSchema)
module.exports = photo