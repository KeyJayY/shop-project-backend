import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as databaseFunctions from './databaseFunctions/database.js';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import { generateToken, verifyAdminToken, authenticateToken } from './middleware/authMiddleware.js';
import {removeItemFromCart} from "./databaseFunctions/database.js";
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static( 'static'));
app.use(cors());
app.use(bodyParser.json());

app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/admin', verifyAdminToken, adminRoutes);
app.use('/auth', authRoutes);


app.get("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getShopItemById(id));
})

app.get("/api/opinions/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getOpinionsByProductId(id));
})


app.get("/api/getShopItems", async (req, res) => {
    const search = req.query.search ? req.query.search : "";
    const sorting = req.query.sorting ? req.query.sorting : "";
    const category = req.query.category ? req.query.category : "";
    res.status(200).json(await databaseFunctions.getShopItems(search, sorting, category));
})

app.get("/api/getCategories", async (req,res) => {
    res.status(200).json(await databaseFunctions.getCategories());
})

app.get("/api/getProductGrade/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getProductGrade(req.params.id))
})

app.get('/image/:id', async (req, res) => {
    const id = req.params.id;
    const data = await databaseFunctions.getImage(id);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="image_${id}"`);

    res.send(data.image);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
