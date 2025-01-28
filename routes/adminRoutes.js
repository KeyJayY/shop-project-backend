import express from 'express';
import bcrypt from 'bcryptjs';
import * as databaseFunctions from '../databaseFunctions/database.js';
import { generateToken, verifyAdminToken, authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router()

router.get("/getUsers/:pageNr", async (req, res) => {
    return res.status(200).json({users: await databaseFunctions.getAllUsers(req.params.pageNr), total: await databaseFunctions.getTotalNumberOfUsers()});
})

router.get("/getAllProducts/:pageNr" , async (req, res) => {
    console.log("getProducts")
    return res.status(200).json({products: await databaseFunctions.getProducts(req.params.pageNr), total: await databaseFunctions.getTotalNumberOfProducts()})
})

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

router.delete("/productSetActiveStatus/:productId/:active", async (req, res) => {
    console.log(await databaseFunctions.productSetActiveStatus(req.params.productId, req.params.active))
    return res.status(200).json({message: "success"})
});

router.get('/getCodes', async (req, res) => {
    try {
        console.log("getCodes")
        const codes = await databaseFunctions.getDiscountCodes();
        res.status(200).json(codes);
    } catch (error) {
        console.error('Error in /getCodes endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addNewCode', async (req, res) => {
    const { code, discount_percent } = req.body;

    if (!code || !discount_percent ) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        console.log(req.user.id)
        const newCode = await databaseFunctions.addDiscountCode(code, discount_percent, req.user.id);
        res.status(201).json({ message: 'Discount code added successfully', code: newCode });
    } catch (error) {
        if(error.code == 23505){
            return res.status(409).json({message: "code already in database"});
        }
        console.error('Error in /addNewCode endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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

router.get("/getOrderDetails/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getOrderDetails(req.params.id));
})

router.get('/getAllOrders/:page', async (req, res) => {
    try {
        res.status(200).json({orders: await databaseFunctions.getAllOrders(req.params.page), total: await databaseFunctions.getTotalNumberOfOrders()});
    } catch (error) {
        console.error('Error in endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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

router.post("/getSalesStatistics", async (req, res) => {
    try {
        const {start_date, end_date, interval} = req.body;
        console.log(start_date, end_date)
        const data = await databaseFunctions.getSalesStatistics(start_date, end_date, interval);
        console.log(data)
        res.status(200).json(data);
    } catch (error) {
        console.error('Error in /getCodes endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get("/getTopProducts/:category", async (req, res) => {
    try {
        let category = req.params.category;
        if(category == "all")
            category = '';
        const data = await databaseFunctions.getTopProducts(category);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get("/getTopPopularProducts/:category", async (req, res) => {
    try {
        let category = req.params.category;
        if(category == "all")
            category = '';
        const data = await databaseFunctions.getTopPopularProducts(category);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})

export default router;