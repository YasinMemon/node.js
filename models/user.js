const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/miniXproject");

const userSchema = mongoose.Schema({
    fullname: String,
    username: String,
    name: String,
    dob: Date,
    email: String,
    password: String,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        }
    ]
});

module.exports = mongoose.model("user", userSchema);