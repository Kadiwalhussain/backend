require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/db/db");

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();


