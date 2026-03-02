const mongoose = require('mongoose');
require('dotenv').config();


function connectToDB() {

    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("connected to database");
    })
    .catch((err)=>{
        console.log("error connecting to database", err);
        process.exit(1);
    })
}


module.exports = connectToDB