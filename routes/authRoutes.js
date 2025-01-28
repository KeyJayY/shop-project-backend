import express from 'express';
import bcrypt from 'bcryptjs';
import * as databaseFunctions from '../databaseFunctions/database.js';
import { verifyAdminToken } from '../middleware/authMiddleware.js';
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET_KEY;

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await databaseFunctions.getUserInfoByEmail(username);

    if (!user) {
        return res.status(400).json({ message: 'wrong username or password!' });
    }

    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ message: 'wrong username or password!' });
    }

    const token = jwt.sign({ email: username, id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Successfully logged in!', token });
});

router.get('/admin/check-token', verifyAdminToken, (req, res) => {
    res.status(200).json({message: "verified"})
});

router.post('/register', async (req, res) => {
    try {
        const data = req.body;
        data.password = await bcrypt.hash(req.body.password, 10);
        const result = await databaseFunctions.addNewUser(data);

        if (result) {
            res.status(200).json({ message: 'Successfully created account!' });
        } else {
            res.status(400).json({ message: 'Failed to create account. Please try again.' });
        }
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ message: 'Email already in use. Please use a different email address.' });
        } else {
            console.error('Error creating account:', error);
            res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
        }
    }
});

router.get("/verifyToken", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ valid: true, user: decoded });
    } catch (err) {
        return res.status(401).json({ valid: false, message: "wrong token" });
    }
})

router.post('/admin/login', async (req, res) => {
    const {username, password} = req.body
    const user = await databaseFunctions.getAdminInfoByUsername(username);
    if(user.password === password){
        const token = jwt.sign({ email: username, id: user.admin_id, role: "admin" }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ success: true, token });
    } else {
        res.status(400).json({ message: 'wrong username or password!' });
    }

});



export default router;


