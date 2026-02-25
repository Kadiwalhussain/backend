const express = require('express'); 
const authController = require("../controllers/auth.controllers");


const router = express.Router();    

router.post("/register", authController.registerUser);
router.get("/register", (_req, res) => {
    return res.status(405).json({ message: "Use POST /auth/register" });
});

module.exports = router;    
