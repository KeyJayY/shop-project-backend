import pkg from 'pg';

const {Pool} = pkg;

const pool = new Pool({
    host: process.env.HOST,
    port: 5432,
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