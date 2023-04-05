const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    id: { type: Number, unique: true },

    Identity: { type: Number },
    Matches: { type: Number },
    Rank: { type: Number },
    Place: { type: String },
    Registration: { type: Date }

});


const User = mongoose.model('User', userSchema);

module.exports = User;
