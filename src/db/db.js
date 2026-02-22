const mongoose = require('mongoose');

async function connectDB() {
    await mongoose.connect("mongodb+srv://Ovesh:lazqS8R9sj2BvFhf@hussainbackend.i7zhyqd.mongodb.net/halley")


    console.log("Connected to MongoDB");
}

module.exports = connectDB;