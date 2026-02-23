const express = require('express');
const noteModel = require('./models/note.model')

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "API is running"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});


app.post("/notes", async (req, res) => {
    const data = req.body
    await noteModel.create({
        title: data.title,
        description: data.description
    })

    res.status(201).json({
        message: "Note Created"
    })


})






module.exports = app;