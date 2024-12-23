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

export const getShopItems = async (search = "", sort= "", category = "") => {
    const query = `SELECT * FROM product WHERE LOWER(name) LIKE LOWER($1) ${category ? "AND category = $2" : ""} ${sort ? sort === "desc" ? "ORDER BY price DESC" : "ORDER BY price ASC" : ""}`;
    const parameters = category ? [`%${search}%`, category] : [`%${search}%`];
    return (await pool.query(query, parameters)).rows;

}

export const getCategories = async () => {
    return (await pool.query(`SELECT DISTINCT category FROM product`)).rows;
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
    return (await pool.query('SELECT user_id, first_name, last_name, address, address_city, birth_date FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
}

export const getOpinionsByProductId = async (productId) => {
    return (await pool.query('SELECT opinion as content, grade, first_name as author FROM opinion JOIN "user" ON user_id = client_id WHERE product_id = $1', [productId])).rows;
}

export const addToCart = async (productId, amount, userId) => {
    return (await pool.query('INSERT INTO products_in_carts VALUES ($1, $2, $3)', [userId, productId, amount]));
}

export const getCartItemsByUserId = async (userId) => {
    return (await pool.query('SELECT products_in_carts.product_id, name, price, amount FROM products_in_carts JOIN product ON product.product_id = products_in_carts.product_id WHERE products_in_carts.client_id = $1', [userId])).rows;
}

export const updateUserData = async (user, userId) => {
    return (await pool.query('UPDATE "user" SET first_name = $1, last_name = $2, address = $3, address_city = $4, birth_date = $5 WHERE user_id = $6', [user.first_name, user.last_name, user.address, user.address_city, user.birth_date, userId]));
}

export const addProductOpinion = async (productId, userId, opinion, grade) => {
    return await pool.query('INSERT INTO opinion VALUES ($1, $2, $3, $4)', [productId, userId, opinion, grade])
}

export const getImage = async (id) => {
    try {
        const result = await pool.query(
            'SELECT image FROM image WHERE image_id = $1',
            [id]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Błąd podczas pobierania obrazu:', error);
        res.status(500).send('Wystąpił błąd serwera');
    }
}
