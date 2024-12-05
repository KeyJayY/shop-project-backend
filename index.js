import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {addNewUser, getShopItems, getUserInfoByEmail, getShopItemById, getUserDataByEmail} from './databaseFunctions/database.js';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static( 'static'));
app.use(cors());
app.use(bodyParser.json());

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await getUserInfoByEmail(username);

    if (!user) {
        return res.status(400).json({ message: 'wrong username or password!' });
    }

    if (!await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ message: 'wrong username or password!' });
    }

    const token = jwt.sign({ email: username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Successfully logged in!', token });
});


app.post('/register', async (req, res) => {
    const data = req.body;
    data.password = await bcrypt.hash(req.body.password, 10);
    const result = await addNewUser(data)
    if(result){
        res.status(200).json({message: 'Successfully created account!'});
    }

});

app.get("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await getShopItemById(id));
})

app.get("/api/userData", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json(await getUserDataByEmail(decoded.email))
    } catch (err) {
        console.log(err)
        return res.status(401).json({ valid: false, message: "wrong token" });
    }
})



app.get("/api/verifyToken", (req, res) => {
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

app.get("/api/getShopItems", async (req, res) => {
    res.status(200).json(await getShopItems());
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
