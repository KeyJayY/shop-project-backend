import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
    host: process.env.HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', (client) => {
    client.query('SET search_path TO store_project');
});

export const getShopItems = async () => {
    return (await pool.query("SELECT * FROM product")).rows;
}

export const getUserInfoByEmail = async (email) => {
    return (await pool.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
}

export const addNewUser = async (user) => {
    return await pool.query(
        'INSERT INTO "user" (first_name, last_name, email, address, address_city, birth_date, password) VALUES ($1, $2, $3, $4, $5, $6, $7);',
        Object.values(user)
    );
}

export const getShopItemById = async (id) => {
    return (await pool.query("SELECT * FROM product WHERE product_id = $1", [id])).rows[0];
}

export const getUserDataByEmail = async (email) => {
    return (await pool.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
}

export const getOpinionsByProductId = async (productId) => {
    return (await pool.query('SELECT opinion as content, first_name as author FROM opinion JOIN "user" ON user_id = client_id WHERE product_id = $1', [productId])).rows;
}

export const addToCart = async (productId, amount, userId) => {
    return (await pool.query('INSERT INTO products_in_carts VALUES ($1, $2, $3)', [userId, productId, amount]));
}

export const getCartItemsByUserId = async (userId) => {
    return (await pool.query('SELECT products_in_carts.product_id, name, price, amount FROM products_in_carts JOIN product ON product.product_id = products_in_carts.product_id WHERE products_in_carts.client_id = $1', [userId])).rows;
}