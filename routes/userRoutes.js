import express from 'express';
import * as databaseFunctions from '../databaseFunctions/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/userData", authenticateToken, async (req, res) => {
    return res.status(200).json(await databaseFunctions.getUserDataByEmail(req.user.email))
})

router.put("/order", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    await databaseFunctions.createOrder(userId, req.body.code, req.body.address, req.body.city);
    res.status(200).json({message: 'Successfully created order!'});
})

router.get("/getOrderDetails/:id", async (req, res) => {
    res.status(200).json(await databaseFunctions.getOrderDetails(req.params.id));
})

router.delete("/cart/:id", authenticateToken, async (req, res) =>{
    if((await databaseFunctions.removeItemFromCart(req.params.id, req.user.id)).rowCount > 0){
        res.status(200).json({message: 'Item removed!'});
    } else {
        res.status(400).json({message: 'error!'});
    }

});

router.post("/opinion/add", authenticateToken, async (req, res) => {
    try{
        await databaseFunctions.addProductOpinion(req.body.productId, req.user.id, req.body.opinion, req.body.grade);
        res.status(200).json("dodano opinie")
    } catch (e){
        res.status(400).json("opinia o tym produkcie od tego użytkownika już istnieje")
    }
})

router.put("/changeUserData", authenticateToken, async (req, res) => {
    if((await databaseFunctions.updateUserData(req.body, req.user.id)).rowCount > 0)
        return res.status(200).json({message: 'Successfully updated user data!'});
    return res.status(404).json({message: "failed"});
})

router.post("/addToCart", authenticateToken, async (req, res) => {
    try {
        const {productId, amount} = req.body;
        const userId = req.user.id;
        await databaseFunctions.addToCart(productId, amount, userId);
        res.status(200).json({message: 'Successfully add to cart!'});
    } catch (err) {
        if(err.code == 23505)
            return res.status(409).json({ error: "item already in cart" });
        return res.status(401).json({ message: "error" });
    }

})

router.get("/cart", authenticateToken, async (req, res) => {
    res.status(200).json(await databaseFunctions.getCartItemsByUserId(req.user.id));
})

router.get("/getOrderHistory", authenticateToken,  async (req,res) => {
    res.status(200).json(await databaseFunctions.getOrdersByUserId(req.user.id));
})

router.get("/checkCode", async (req, res) => {
    if((await databaseFunctions.getCode(req.query.code)).length > 0){
        res.status(200).json({message: "correct"});
    } else{
        res.status(200).json({message: "wrong code"});
    }
})

export default router;