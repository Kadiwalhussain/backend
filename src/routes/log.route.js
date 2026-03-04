const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { createLogController, getLogsController } = require("../controllers/log.controller");

const logRouter = Router();

logRouter.post("/", createLogController);
logRouter.get("/", authMiddleware, getLogsController);

module.exports = logRouter;
