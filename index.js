import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as databaseFunctions from './databaseFunctions/database.js';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import {removeItemFromCart} from "./databaseFunctions/database.js";

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


app.post('/register', async (req, res) => {
    const data = req.body;
    data.password = await bcrypt.hash(req.body.password, 10);
    const result = await databaseFunctions.addNewUser(data)
    if(result){
        res.status(200).json({message: 'Successfully created account!'});
    }

});

app.get("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getShopItemById(id));
})

app.get("/api/opinions/:id", async (req, res) => {
    const { id } = req.params;
    res.status(200).json(await databaseFunctions.getOpinionsByProductId(id));
})

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token" });
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user =  jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ valid: false, message: "Wrong token" });
    }
};

app.delete("/api/cart/:id", authenticateToken, async (req, res) =>{
    if((await removeItemFromCart(req.params.id, req.user.id)).rowCount > 0){
        res.status(200).json({message: 'Item removed!'});
    } else {
        res.status(400).json({message: 'error!'});
    }

});

app.post("/api/opinion/add", authenticateToken, async (req, res) => {
    try{
        await databaseFunctions.addProductOpinion(req.body.productId, req.user.id, req.body.opinion, req.body.grade);
        res.status(200).json("dodano opinie")
    } catch (e){
        res.status(400).json("opinia o tym produkcie od tego użytkownika już istnieje")
    }
})

app.put("/api/changeUserData", authenticateToken, async (req, res) => {
    if((await databaseFunctions.updateUserData(req.body, req.user.id)).rowCount > 0)
        return res.status(200).json({message: 'Successfully updated user data!'});
    return res.status(404).json({message: "failed"});
})

app.get("/api/userData", authenticateToken, async (req, res) => {
    return res.status(200).json(await databaseFunctions.getUserDataByEmail(req.user.email))
})

app.post("/api/addToCart", authenticateToken, async (req, res) => {
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

app.get("/api/cart", authenticateToken, async (req, res) => {
    res.status(200).json(await databaseFunctions.getCartItemsByUserId(req.user.id));
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
    const search = req.query.search ? req.query.search : "";
    const sorting = req.query.sorting ? req.query.sorting : "";
    const category = req.query.category ? req.query.category : "";
    res.status(200).json(await databaseFunctions.getShopItems(search, sorting, category));
})

app.get("/api/getCategories", async (req,res) => {
    res.status(200).json(await databaseFunctions.getCategories());
})

app.get("/api/getOrderHistory", authenticateToken,  async (req,res) => {
    res.status(200).json(await databaseFunctions.getOrdersByUserId(req.user.id));
})

app.get('/image/:id', async (req, res) => {
    const id = req.params.id;
    const data = await databaseFunctions.getImage(id);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${data.name}"`);

    res.send(data.image);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
