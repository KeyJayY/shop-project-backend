import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as databaseFunctions from './databaseFunctions/database.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateToken, verifyAdminToken, authenticateToken } from './middleware/authMiddleware.js';
import { removeItemFromCart } from "./databaseFunctions/database.js";
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('static'));
app.use(cors());
app.use(bodyParser.json());

/**
 * @route GET /api/user
 * @description Obsługuje trasy użytkowników, wymaga tokenu uwierzytelniającego
 */
app.use('/api/user', authenticateToken, userRoutes);

/**
 * @route GET /api/admin
 * @description Obsługuje trasy administratora, wymaga tokenu administratora
 */
app.use('/api/admin', verifyAdminToken, adminRoutes);

/**
 * @route GET /auth
 * @description Obsługuje trasy uwierzytelniania
 */
app.use('/auth', authRoutes);

/**
 * @route GET /api/product/:id
 * @description Pobiera dane produktu na podstawie ID
 * @param {string} id - ID produktu
 */
app.get("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getShopItemById(id));
});

/**
 * @route GET /api/opinions/:id
 * @description Pobiera opinie o produkcie na podstawie ID produktu
 * @param {string} id - ID produktu
 */
app.get("/api/opinions/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getOpinionsByProductId(id));
});

/**
 * @route GET /api/getShopItems
 * @description Pobiera listę produktów na podstawie zapytania, sortowania i kategorii
 * @query {string} search - Fraza do wyszukania produktów
 * @query {string} sorting - Parametr sortowania
 * @query {string} category - Kategoria produktów
 */
app.get("/api/getShopItems", async (req, res) => {
    const search = req.query.search ? req.query.search : "";
    const sorting = req.query.sorting ? req.query.sorting : "";
    const category = req.query.category ? req.query.category : "";
    res.status(200).json(await databaseFunctions.getShopItems(search, sorting, category));
});

/**
 * @route GET /api/getCategories
 * @description Pobiera listę dostępnych kategorii
 */
app.get("/api/getCategories", async (req, res) => {
    res.status(200).json(await databaseFunctions.getCategories());
});

/**
 * @route GET /api/getProductGrade/:id
 * @description Pobiera ocenę produktu na podstawie ID
 * @param {string} id - ID produktu
 */
app.get("/api/getProductGrade/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getProductGrade(req.params.id));
});

/**
 * @route GET /image/:id
 * @description Pobiera obrazek na podstawie ID
 * @param {string} id - ID obrazka
 */
app.get('/image/:id', async (req, res) => {
    const id = req.params.id;
    const data = await databaseFunctions.getImage(id);
    try {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `inline; filename="image_${id}"`);
        res.send(data.image);
    } catch (error) {
        res.status(404).json({ message: "no image available" });
    }
});

/**
 * @route GET *
 * @description Obsługuje wszystkie inne trasy, przekierowuje do pliku index.html
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Uruchomienie serwera na porcie określonym w zmiennych środowiskowych lub domyślnie na 5000
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
