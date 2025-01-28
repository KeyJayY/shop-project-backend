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

export const getShopItems = async (search = "", sort = "", category = "") => {
    const query = `
    SELECT
        *
    FROM active_products_with_images 
    WHERE LOWER(name) 
    LIKE LOWER($1) ${category ? "AND category = $2" : ""} ${sort ? sort === "desc" ? "ORDER BY price DESC" : "ORDER BY price ASC" : ""}`;
    const parameters = category ? [`%${search}%`, category] : [`%${search}%`];
    return (await pool.query(query, parameters)).rows;

}

export const getCategories = async () => {
    return (await pool.query(`SELECT DISTINCT category FROM product`)).rows;
}

export const getUserInfoByEmail = async (email) => {
    return (await pool.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
}

export const getAllUsers = async (pageNr) => {
    try {
        const recordsPerPage = 50;
        const offset = (pageNr - 1) * recordsPerPage;

        const query = `
          SELECT 
            user_id, 
            first_name, 
            last_name, 
            address, 
            email, 
            address_city, 
            birth_date
          FROM 
            "user"
          ORDER BY 
            user_id
          LIMIT $1 OFFSET $2;
        `;

        const result = await pool.query(query, [recordsPerPage, offset]);

        return result.rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

export const getTotalNumberOfUsers = async () => {
    try {
        const query = `
      SELECT 
        COUNT(*) AS total
      FROM 
        "user";
    `;
        const result = await pool.query(query);
        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        console.error('Error fetching total users:', error);
        throw error;
    }
};

export const getTotalNumberOfOrders = async () => {
    try {
        const query = `
      SELECT 
        COUNT(*) AS total
      FROM 
        "order";
    `;
        const result = await pool.query(query);
        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        console.error('Error fetching total users:', error);
        throw error;
    }
};

export const getProducts = async (page) => {
    try {
        const recordsPerPage = 50;
        const offset = (page - 1) * recordsPerPage;
        const query = `
      SELECT 
        product_id, 
        name, 
        category, 
        price, 
        description,
        active
      FROM 
        "product"
      ORDER BY 
        product_id
      LIMIT $1 OFFSET $2;
    `;
        const result = await pool.query(query, [recordsPerPage, offset]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};


export const getAdminInfoByUsername = async (username) => {
    return (await pool.query('SELECT * FROM admin WHERE username = $1 LIMIT 1', [username])).rows[0];
}

export const addAdmin = async (username, password) => {
    try {
        const query = `
            INSERT INTO admin (username, password)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [username, password]);

        return result.rows[0];
    } catch (error) {
        console.error('Error adding admin:', error);
        throw error;
    }
};

export const addNewUser = async (user) => {
    return await pool.query(
        'INSERT INTO "user" (first_name, last_name, email, address, address_city, birth_date, password) VALUES ($1, $2, $3, $4, $5, $6, $7);',
        Object.values(user)
    );
}

export const getShopItemById = async (id) => {
    return (await pool.query("SELECT p.*, AVG(o.grade) AS average_grade FROM product p LEFT JOIN opinion o ON p.product_id = o.product_id WHERE p.product_id = $1 GROUP BY p.product_id;\n", [id])).rows[0];
}

export const getUserDataByEmail = async (email) => {
    return (await pool.query('SELECT user_id, first_name, last_name, address, address_city, birth_date, email FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
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

export const getSalesStatistics = async (startDate, endDate, interval) => {
    let period = "";
    switch (interval){
        case "day":
            period = "DATE(o.date)"
            break;
        case "week":
            period = "CONCAT(EXTRACT(YEAR FROM o.date), '-W', EXTRACT(WEEK FROM o.date))"
            break;
        case "month":
            period = "CONCAT(EXTRACT(YEAR FROM o.date), '-', LPAD(EXTRACT(MONTH FROM o.date)::TEXT, 2, '0'))"
            break;
        case "year":
            period = "EXTRACT(YEAR FROM o.date)::TEXT"
            break;
    }
    const query = `
    SELECT 
        ${period} AS period,
        SUM(op.amount * p.price * (1 - COALESCE(dc.discount_percent, 0) / 100.0)) AS total_sales_with_discount,
        SUM(op.amount * p.price) AS total_sales_without_discount
    FROM 
        "order" o
    JOIN 
        order_product op ON o.order_id = op.order_id
    JOIN 
        product p ON op.product_id = p.product_id
    LEFT JOIN 
        discount_code dc ON o.discount_code = dc.code
    WHERE 
        DATE(o.date) BETWEEN $1 AND $2
    GROUP BY 
        ${period}
    ORDER BY 
        period;
    `
    return (await pool.query(query, [startDate, endDate])).rows;
}

export const getTopProducts = async (category) => {
    console.log(category)
    const query = `
    SELECT 
        p.product_id,
        p.name AS product_name,
        p.category,
        COALESCE(SUM(op.amount), 0) AS total_quantity_sold,
        COALESCE(SUM(op.amount * p.price), 0) AS total_sales
    FROM 
        product p
    LEFT JOIN 
        order_product op ON p.product_id = op.product_id
    LEFT JOIN 
        "order" o ON op.order_id = o.order_id
    WHERE 
        ($1 = '' OR p.category = $1)
    GROUP BY 
        p.product_id, p.name, p.category
    ORDER BY 
        total_quantity_sold DESC;

    `;

    const result = await pool.query(query, [category]);

    return result.rows;
}

export const getTopPopularProducts = async (category) => {
    const query = `
    SELECT
        p.product_id,
        p.name AS product_name,
        p.category AS category,
        COUNT(hv.history_id) AS total_views
    FROM
        product p
    LEFT JOIN
        history_of_viewed hv ON p.product_id = hv.product_id
    WHERE
        ($1 = '' OR p.category = $1)
    GROUP BY
        p.product_id, p.name
    ORDER BY
        total_views DESC;
    `;

    return (await pool.query(query, [category])).rows;
}

export const getAllOrders = async (page) => {
    const recordsPerPage = 50;
    const offset = (page - 1) * recordsPerPage;
    const query = `
    SELECT
        o.order_id,
        o.date date,
        CEIL(SUM(op.amount * p.price * (1 - COALESCE(dc.discount_percent, 0) / 100.0))) AS price,
        o.status,
        dc.discount_percent,
        address,
        address_city
    FROM
        "order" o
    JOIN
        order_product op ON o.order_id = op.order_id
    JOIN
        product p ON op.product_id = p.product_id
    LEFT JOIN
        discount_code dc ON o.discount_code = dc.code
    GROUP BY
        o.order_id, discount_percent
    ORDER BY
        o.status, o.order_id
    LIMIT $1 OFFSET $2

    `
    return (await pool.query(query, [recordsPerPage, offset])).rows;
}

export const getOrdersByUserId = async (userId) => {
    const query = `
    SELECT
        o.order_id,
        o.date date,
        CEIL(SUM(op.amount * p.price* (1 - coalesce(dc.discount_percent, 0) / 100.0)))  AS price,
        o.status,
        dc.discount_percent
        FROM
            "order" o
        JOIN
            order_product op ON o.order_id = op.order_id
        JOIN
            product p ON op.product_id = p.product_id
        LEFT JOIN
            discount_code dc ON o.discount_code = dc.code
        WHERE
            o.client_id = $1
        GROUP BY
            o.order_id, discount_percent
        ORDER BY
            o.order_id;

    `
    return (await pool.query(query, [userId])).rows;
}

export const getOrderDetails = async (orderId) => {
    const query = `
    SELECT
        p.product_id,
        p.name AS product_name,
        op.amount AS product_amount
    FROM
        order_product op
    JOIN
        product p ON op.product_id = p.product_id
    WHERE
        op.order_id = $1;
    `
    return (await pool.query(query, [orderId])).rows;
}

export const addProduct = async (name, category, price, description) => {
    try {
        const query = `
      INSERT INTO "product" (name, category, price, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        const result = await pool.query(query, [name, category, price, description]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
};

export const getTotalNumberOfProducts = async () => {
    try {
        const query = `
            SELECT 
                COUNT(*) AS total
            FROM 
                "product";
        `;
        const result = await pool.query(query);
        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        console.error('Error fetching total products:', error);
        throw error;
    }
};


export const updateProduct = async (productId, name, category, price, description) => {
    try {
        const query = `
      UPDATE "product"
      SET name = $1, category = $2, price = $3, description = $4
      WHERE product_id = $5
      RETURNING *;
    `;
        const result = await pool.query(query, [name, category, price, description, productId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const query = `
      UPDATE "order"
      SET status = $2
      WHERE order_id = $1
      RETURNING *;
    `;
        const result = await pool.query(query, [orderId, status]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export const getDiscountCodes = async () => {
    try {
        const query = `
            SELECT * FROM discount_code;
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching discount codes:', error);
        throw error;
    }
};

export const addDiscountCode = async (code, discount, admin_id) => {
    try {
        const query = `
            INSERT INTO discount_code (code, admin_id, discount_percent)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(query, [code, admin_id, discount]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding discount code:', error);
        throw error;
    }
};


export const productSetActiveStatus = async (productId, status) => {
    try {
        const query = `
      UPDATE "product"
      SET active = $1
      WHERE product_id = $2
      RETURNING *;
    `;
        const result = await pool.query(query, [status, productId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error setting product as inactive:', error);
        throw error;
    }
};

export const removeItemFromCart = async (productId, userId) => {
    return (await pool.query('DELETE FROM products_in_carts WHERE product_id = $1 AND client_id = $2', [productId, userId]));
}

export const getImage = async (id) => {
    try {
        const result = await pool.query(
            'SELECT image FROM image WHERE product_id = $1',
            [id]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Błąd podczas pobierania obrazu:', error);
    }
}

export const getProductGrade = async (id) =>{
    return (await pool.query("SELECT AVG(grade) AS average_grade FROM opinions WHERE product_id = $1", [id])).rows[0]
}

export const createOrder = async (clientId, code, address, city) => {
    try {
        await pool.query('BEGIN');

        const insertOrderQuery = `
      INSERT INTO "order" (client_id, date, status, discount_code, address, address_city)
      VALUES ($1, NOW(), 'pakowanie', $2, $3, $4)
      RETURNING order_id
    `;
        const orderResult = await pool.query(insertOrderQuery, [clientId, code, address, city]);
        const orderId = orderResult.rows[0].order_id;

        const insertOrderProductQuery = `
      INSERT INTO order_product (order_id, product_id, amount)
      SELECT $1, product_id, amount
      FROM products_in_carts
      WHERE client_id = $2
    `;
        await pool.query(insertOrderProductQuery, [orderId, clientId]);

        const deleteCartQuery = `
      DELETE FROM products_in_carts
      WHERE client_id = $1
    `;
        await pool.query(deleteCartQuery, [clientId]);

        await pool.query('COMMIT');

        return orderId;
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error placing order:', error);
        throw error;
    }
}

export const getCode = async (code) => {
    const query = 'SELECT * FROM discount_code WHERE code = $1';
    return (await pool.query(query, [code])).rows;
}
