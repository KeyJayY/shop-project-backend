import express from 'express';
import * as databaseFunctions from '../databaseFunctions/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /userData
 * @description Pobiera dane użytkownika na podstawie jego emaila.
 * @access Protected
 */
router.get("/userData", authenticateToken, async (req, res) => {
    return res.status(200).json(await databaseFunctions.getUserDataByEmail(req.user.email));
});

/**
 * @route PUT /order
 * @description Tworzy nowe zamówienie dla użytkownika.
 * @access Protected
 */
router.put("/order", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    await databaseFunctions.createOrder(userId, req.body.code, req.body.address, req.body.city);
    res.status(200).json({ message: 'Successfully created order!' });
});

/**
 * @route GET /getOrderDetails/:id
 * @description Pobiera szczegóły zamówienia na podstawie jego ID.
 * @access Public
 */
router.get("/getOrderDetails/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getOrderDetails(req.params.id));
});

/**
 * @route DELETE /cart/:id
 * @description Usuwa przedmiot z koszyka użytkownika.
 * @access Protected
 */
router.delete("/cart/:id", authenticateToken, async (req, res) => {
    if ((await databaseFunctions.removeItemFromCart(req.params.id, req.user.id)).rowCount > 0) {
        res.status(200).json({ message: 'Item removed!' });
    } else {
        res.status(400).json({ message: 'Error!' });
    }
});

/**
 * @route POST /opinion/add
 * @description Dodaje opinię o produkcie od użytkownika.
 * @access Protected
 */
router.post("/opinion/add", authenticateToken, async (req, res) => {
    try {
        await databaseFunctions.addProductOpinion(req.body.productId, req.user.id, req.body.opinion, req.body.grade);
        res.status(200).json("Opinion added successfully");
    } catch (e) {
        res.status(400).json("Opinion for this product from this user already exists");
    }
});

/**
 * @route PUT /changeUserData
 * @description Aktualizuje dane użytkownika.
 * @access Protected
 */
router.put("/changeUserData", authenticateToken, async (req, res) => {
    if ((await databaseFunctions.updateUserData(req.body, req.user.id)).rowCount > 0)
        return res.status(200).json({ message: 'Successfully updated user data!' });
    return res.status(404).json({ message: "Failed to update user data" });
});

/**
 * @route POST /addToCart
 * @description Dodaje produkt do koszyka użytkownika.
 * @access Protected
 */
router.post("/addToCart", authenticateToken, async (req, res) => {
    try {
        const { productId, amount } = req.body;
        const userId = req.user.id;
        await databaseFunctions.addToCart(productId, amount, userId);
        res.status(200).json({ message: 'Successfully added to cart!' });
    } catch (err) {
        if (err.code == 23505)
            return res.status(409).json({ error: "Item already in cart" });
        return res.status(401).json({ message: "Error adding to cart" });
    }
});

/**
 * @route GET /cart
 * @description Pobiera przedmioty w koszyku użytkownika.
 * @access Protected
 */
router.get("/cart", authenticateToken, async (req, res) => {
    res.status(200).json(await databaseFunctions.getCartItemsByUserId(req.user.id));
});

/**
 * @route GET /getOrderHistory
 * @description Pobiera historię zamówień użytkownika.
 * @access Protected
 */
router.get("/getOrderHistory", authenticateToken, async (req, res) => {
    res.status(200).json(await databaseFunctions.getOrdersByUserId(req.user.id));
});

/**
 * @route GET /checkCode
 * @description Sprawdza poprawność kodu rabatowego.
 * @access Public
 */
router.get("/checkCode", async (req, res) => {
    if ((await databaseFunctions.getCode(req.query.code)).length > 0) {
        res.status(200).json({ message: "Correct code" });
    } else {
        res.status(200).json({ message: "Wrong code" });
    }
});

export default router;
