import express from "express";
import { unauthorized } from "../middlewares/checkPermission.js";
const router = express.Router();

router.get('/unauthorized', unauthorized);

export default router;