import express from "express";
import { login, showLogin } from "../controller/authController.js";
const router = express.Router();

router.get('/login', showLogin);
router.post('/login', login);
router.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('dashboard', {user: req.session.user});
});

export default router;