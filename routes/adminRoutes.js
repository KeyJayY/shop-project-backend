import express from 'express';
import bcrypt from 'bcryptjs';
import * as databaseFunctions from '../databaseFunctions/database.js';
import { generateToken, verifyAdminToken, authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /admin/getUsers/:pageNr
 * @description Pobiera użytkowników z paginacją
 * @param {number} pageNr - Numer strony
 */
router.get("/getUsers/:pageNr", async (req, res) => {
    return res.status(200).json({ users: await databaseFunctions.getAllUsers(req.params.pageNr), total: await databaseFunctions.getTotalNumberOfUsers() });
});

/**
 * @route GET /admin/getAllProducts/:pageNr
 * @description Pobiera produkty z paginacją
 * @param {number} pageNr - Numer strony
 */
router.get("/getAllProducts/:pageNr", async (req, res) => {
    return res.status(200).json({ products: await databaseFunctions.getProducts(req.params.pageNr), total: await databaseFunctions.getTotalNumberOfProducts() });
});

/**
 * @route PUT /admin/updateProduct/:productId
 * @description Aktualizuje dane produktu
 * @param {string} productId - ID produktu
 * @param {string} name - Nazwa produktu
 * @param {string} category - Kategoria produktu
 * @param {number} price - Cena produktu
 * @param {string} description - Opis produktu
 */
router.put("/updateProduct/:productId", async (req, res) => {
    const { name, category, price, description } = req.body;
    try {
        const updatedProduct = await databaseFunctions.updateProduct(req.params.productId, name, category, price, description);

        if (updatedProduct) {
            res.status(200).json({ message: "success", product: updatedProduct });
        } else {
            res.status(400).json({ message: "Product not found or update failed" });
        }
    } catch (error) {
        console.error("Error in updateProduct route:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @route POST /admin/addNewProduct
 * @description Dodaje nowy produkt
 * @param {string} name - Nazwa produktu
 * @param {string} category - Kategoria produktu
 * @param {number} price - Cena produktu
 * @param {string} description - Opis produktu
 */
router.post('/addNewProduct', async (req, res) => {
    const { name, category, price, description } = req.body;
    try {
        const newProduct = await databaseFunctions.addProduct(name, category, price, description);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding new product:', error);
        res.status(500).json({ error: 'Failed to add new product' });
    }
});

/**
 * @route DELETE /admin/productSetActiveStatus/:productId/:active
 * @description Ustawia status aktywności produktu
 * @param {string} productId - ID produktu
 * @param {boolean} active - Status aktywności
 */
router.delete("/productSetActiveStatus/:productId/:active", async (req, res) => {
    try {
        await databaseFunctions.productSetActiveStatus(req.params.productId, req.params.active);
        return res.status(200).json({ message: "success" });
    } catch (error) {
        return res.status(400).json({ message: "Failed" });
    }
});

/**
 * @route GET /admin/getCodes
 * @description Pobiera wszystkie kody rabatowe
 */
router.get('/getCodes', async (req, res) => {
    try {
        const codes = await databaseFunctions.getDiscountCodes();
        res.status(200).json(codes);
    } catch (error) {
        console.error('Error in /getCodes endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route POST /admin/addNewCode
 * @description Dodaje nowy kod rabatowy
 * @param {string} code - Kod rabatowy
 * @param {number} discount_percent - Procent rabatu
 */
router.post('/addNewCode', async (req, res) => {
    const { code, discount_percent } = req.body;

    if (!code || !discount_percent) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        const newCode = await databaseFunctions.addDiscountCode(code, discount_percent, req.user.id);
        res.status(201).json({ message: 'Discount code added successfully', code: newCode });
    } catch (error) {
        if (error.code == 23505) {
            return res.status(409).json({ message: "code already in database" });
        }
        console.error('Error in /addNewCode endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route POST /admin/addNewAdmin
 * @description Dodaje nowego administratora
 * @param {string} username - Nazwa użytkownika
 * @param {string} password - Hasło
 */
router.post('/addNewAdmin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        const newAdmin = await databaseFunctions.addAdmin(username, password);
        res.status(201).json({
            message: 'Admin added successfully',
            admin: { id: newAdmin.id, username: newAdmin.username },
        });
    } catch (error) {
        console.error('Error in /addNewAdmin endpoint:', error);

        if (error.code === '23505') {
            res.status(409).json({ message: 'Username already exists' });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

/**
 * @route GET /admin/getOrderDetails/:id
 * @description Pobiera szczegóły zamówienia na podstawie ID
 * @param {string} id - ID zamówienia
 */
router.get("/getOrderDetails/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getOrderDetails(req.params.id));
});

/**
 * @route GET /admin/getAllOrders/:page
 * @description Pobiera wszystkie zamówienia z paginacją
 * @param {number} page - Numer strony
 */
router.get('/getAllOrders/:page', async (req, res) => {
    try {
        res.status(200).json({ orders: await databaseFunctions.getAllOrders(req.params.page), total: await databaseFunctions.getTotalNumberOfOrders() });
    } catch (error) {
        console.error('Error in endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route PUT /admin/updateOrderStatus/:orderId
 * @description Aktualizuje status zamówienia
 * @param {string} orderId - ID zamówienia
 * @param {string} status - Nowy status zamówienia
 */
router.put("/updateOrderStatus/:orderId", async (req, res) => {
    const { status } = req.body;
    try {
        const updatedProduct = await databaseFunctions.updateOrderStatus(req.params.orderId, status);

        if (updatedProduct) {
            res.status(200).json({ message: "success", product: updatedProduct });
        } else {
            res.status(400).json({ message: "Order not found or update failed" });
        }
    } catch (error) {
        console.error("Error in updateOrderStatus route:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @route POST /admin/getSalesStatistics
 * @description Pobiera statystyki sprzedaży
 * @param {string} start_date - Data początkowa
 * @param {string} end_date - Data końcowa
 * @param {string} interval - Interwał statystyk
 */
router.post("/getSalesStatistics", async (req, res) => {
    try {
        const { start_date, end_date, interval } = req.body;
        const data = await databaseFunctions.getSalesStatistics(start_date, end_date, interval);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error in /getSalesStatistics endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route GET /admin/getTopProducts/:category
 * @description Pobiera najlepiej sprzedające się produkty w danej kategorii
 * @param {string} category - Kategoria produktów (lub "all")
 */
router.get("/getTopProducts/:category", async (req, res) => {
    try {
        let category = req.params.category;
        if (category == "all") category = '';
        const data = await databaseFunctions.getTopProducts(category);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * @route GET /admin/getTopPopularProducts/:category
 * @description Pobiera najpopularniejsze produkty w danej kategorii
 * @param {string} category - Kategoria produktów (lub "all")
 */
router.get("/getTopPopularProducts/:category", async (req, res) => {
    try {
        let category = req.params.category;
        if (category == "all") category = '';
        const data = await databaseFunctions.getTopPopularProducts(category);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
