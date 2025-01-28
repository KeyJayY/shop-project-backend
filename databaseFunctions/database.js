import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

/**
 * Inicjalizuje pulę połączeń do bazy danych PostgreSQL.
 */
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

/**
 * Ustawia domyślny schemat bazy danych po połączeniu.
 */
pool.on('connect', (client) => {
    client.query('SET search_path TO store_project');
});

/**
 * Pobiera produkty dostępne w sklepie na podstawie kryteriów wyszukiwania, sortowania i kategorii.
 * @param {string} search - Fraza do wyszukiwania produktów.
 * @param {string} sort - Sposób sortowania produktów (asc lub desc).
 * @param {string} category - Kategoria produktów.
 * @returns {Promise<Array>} - Lista produktów pasujących do kryteriów.
 */
export const getShopItems = async (search = "", sort = "", category = "") => {
    const query = `
    SELECT
        *
    FROM active_products_with_images 
    WHERE LOWER(name) 
    LIKE LOWER($1) ${category ? "AND category = $2" : ""} ${sort ? sort === "desc" ? "ORDER BY price DESC" : "ORDER BY price ASC" : ""}`;
    const parameters = category ? [`%${search}%`, category] : [`%${search}%`];
    return (await pool.query(query, parameters)).rows;
};

/**
 * Pobiera wszystkie dostępne kategorie produktów.
 * @returns {Promise<Array>} - Lista kategorii produktów.
 */
export const getCategories = async () => {
    return (await pool.query(`SELECT DISTINCT category FROM product`)).rows;
};

/**
 * Pobiera informacje o użytkowniku na podstawie jego adresu e-mail.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {Promise<Object>} - Informacje o użytkowniku.
 */
export const getUserInfoByEmail = async (email) => {
    return (await pool.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
};

/**
 * Pobiera wszystkich użytkowników z bazy danych z paginacją.
 * @param {number} pageNr - Numer strony.
 * @returns {Promise<Array>} - Lista użytkowników.
 */
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

/**
 * Pobiera całkowitą liczbę użytkowników w bazie danych.
 * @returns {Promise<number>} - Liczba użytkowników.
 */
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

/**
 * Pobiera całkowitą liczbę zamówień w bazie danych.
 * @returns {Promise<number>} - Liczba zamówień.
 */
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
        console.error('Error fetching total orders:', error);
        throw error;
    }
};

/**
 * Pobiera listę produktów z paginacją.
 * @param {number} page - Numer strony.
 * @returns {Promise<Array>} - Lista produktów.
 */
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

/**
 * Pobiera informacje o administratorze na podstawie nazwy użytkownika.
 * @param {string} username - Nazwa użytkownika administratora.
 * @returns {Promise<Object>} - Informacje o administratorze.
 */
export const getAdminInfoByUsername = async (username) => {
    return (await pool.query('SELECT * FROM admin WHERE username = $1 LIMIT 1', [username])).rows[0];
};

/**
 * Dodaje nowego administratora do bazy danych.
 * @param {string} username - Nazwa użytkownika administratora.
 * @param {string} password - Hasło administratora.
 * @returns {Promise<Object>} - Informacje o dodanym administratorze.
 */
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

/**
 * Dodaje nowego użytkownika do bazy danych.
 * @param {Object} user - Obiekt zawierający dane użytkownika.
 * @param {string} user.first_name - Imię użytkownika.
 * @param {string} user.last_name - Nazwisko użytkownika.
 * @param {string} user.email - Adres e-mail użytkownika.
 * @param {string} user.address - Adres użytkownika.
 * @param {string} user.address_city - Miasto użytkownika.
 * @param {string} user.birth_date - Data urodzenia użytkownika.
 * @param {string} user.password - Hasło użytkownika.
 * @returns {Promise<void>}
 */
export const addNewUser = async (user) => {
    return await pool.query(
        'INSERT INTO "user" (first_name, last_name, email, address, address_city, birth_date, password) VALUES ($1, $2, $3, $4, $5, $6, $7);',
        Object.values(user)
    );
};

/**
 * Pobiera szczegóły produktu na podstawie jego ID.
 * @param {number} id - ID produktu.
 * @returns {Promise<Object>} - Szczegóły produktu.
 */
export const getShopItemById = async (id) => {
    return (await pool.query("SELECT p.*, AVG(o.grade) AS average_grade FROM product p LEFT JOIN opinion o ON p.product_id = o.product_id WHERE p.product_id = $1 GROUP BY p.product_id;", [id])).rows[0];
};

/**
 * Pobiera dane użytkownika na podstawie adresu e-mail.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {Promise<Object>} - Dane użytkownika.
 */
export const getUserDataByEmail = async (email) => {
    return (await pool.query('SELECT user_id, first_name, last_name, address, address_city, birth_date, email FROM "user" WHERE email = $1 LIMIT 1', [email])).rows[0];
};

/**
 * Pobiera opinie o produkcie na podstawie jego ID.
 * @param {number} productId - ID produktu.
 * @returns {Promise<Array>} - Lista opinii o produkcie.
 */
export const getOpinionsByProductId = async (productId) => {
    return (await pool.query('SELECT opinion as content, grade, first_name as author FROM opinion JOIN "user" ON user_id = client_id WHERE product_id = $1', [productId])).rows;
};

/**
 * Dodaje produkt do koszyka użytkownika.
 * @param {number} productId - ID produktu.
 * @param {number} amount - Ilość produktu.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<void>}
 */
export const addToCart = async (productId, amount, userId) => {
    return (await pool.query('INSERT INTO products_in_carts VALUES ($1, $2, $3)', [userId, productId, amount]));
};

/**
 * Pobiera produkty z koszyka użytkownika na podstawie jego ID.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<Array>} - Lista produktów w koszyku.
 */
export const getCartItemsByUserId = async (userId) => {
    return (await pool.query('SELECT product_id, name, price, amount FROM user_cart WHERE client_id = $1', [userId])).rows;
};

/**
 * Aktualizuje dane użytkownika na podstawie jego ID.
 * @param {Object} user - Obiekt zawierający dane użytkownika.
 * @param {string} user.first_name - Imię użytkownika.
 * @param {string} user.last_name - Nazwisko użytkownika.
 * @param {string} user.address - Adres użytkownika.
 * @param {string} user.address_city - Miasto użytkownika.
 * @param {string} user.birth_date - Data urodzenia użytkownika.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<void>}
 */
export const updateUserData = async (user, userId) => {
    return (await pool.query('UPDATE "user" SET first_name = $1, last_name = $2, address = $3, address_city = $4, birth_date = $5 WHERE user_id = $6', [user.first_name, user.last_name, user.address, user.address_city, user.birth_date, userId]));
};

/**
 * Dodaje opinię o produkcie.
 * @param {number} productId - ID produktu.
 * @param {number} userId - ID użytkownika.
 * @param {string} opinion - Treść opinii.
 * @param {number} grade - Ocena produktu.
 * @returns {Promise<void>}
 */
export const addProductOpinion = async (productId, userId, opinion, grade) => {
    return await pool.query('INSERT INTO opinion VALUES ($1, $2, $3, $4)', [productId, userId, opinion, grade]);
};

/**
 * Pobiera statystyki sprzedaży w określonym przedziale czasowym i interwale.
 * @param {string} startDate - Data początkowa.
 * @param {string} endDate - Data końcowa.
 * @param {string} interval - Interwał ("day", "week", "month", "year").
 * @returns {Promise<Array>} - Statystyki sprzedaży.
 */
export const getSalesStatistics = async (startDate, endDate, interval) => {
    let period = "";
    switch (interval) {
        case "day":
            period = "DATE(o.date)";
            break;
        case "week":
            period = "CONCAT(EXTRACT(YEAR FROM o.date), '-W', EXTRACT(WEEK FROM o.date))";
            break;
        case "month":
            period = "CONCAT(EXTRACT(YEAR FROM o.date), '-', LPAD(EXTRACT(MONTH FROM o.date)::TEXT, 2, '0'))";
            break;
        case "year":
            period = "EXTRACT(YEAR FROM o.date)::TEXT";
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
    `;
    return (await pool.query(query, [startDate, endDate])).rows;
};

/**
 * Pobiera najlepiej sprzedające się produkty z opcjonalnym filtrem kategorii.
 * @param {string} category - Kategoria produktów (opcjonalnie).
 * @returns {Promise<Array>} - Lista najlepiej sprzedających się produktów.
 */
export const getTopProducts = async (category) => {
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
};

/**
 * Pobiera najpopularniejsze produkty na podstawie liczby wyświetleń.
 * @param {string} category - Kategoria produktów (opcjonalnie).
 * @returns {Promise<Array>} - Lista najpopularniejszych produktów.
 */
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
};

/**
 * Pobiera wszystkie zamówienia z paginacją.
 * @param {number} page - Numer strony.
 * @returns {Promise<Array>} - Lista zamówień.
 */
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
    LIMIT $1 OFFSET $2;
    `;
    return (await pool.query(query, [recordsPerPage, offset])).rows;
};

/**
 * Pobiera zamówienia użytkownika na podstawie jego ID.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<Array>} - Lista zamówień użytkownika.
 */
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
    `;
    return (await pool.query(query, [userId])).rows;
};

/**
 * Pobiera szczegóły zamówienia na podstawie jego ID.
 * @param {number} orderId - ID zamówienia.
 * @returns {Promise<Array>} - Szczegóły zamówienia, w tym produkty i ich ilości.
 */
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
    `;
    return (await pool.query(query, [orderId])).rows;
};

/**
 * Dodaje nowy produkt do bazy danych.
 * @param {string} name - Nazwa produktu.
 * @param {string} category - Kategoria produktu.
 * @param {number} price - Cena produktu.
 * @param {string} description - Opis produktu.
 * @returns {Promise<Object>} - Szczegóły dodanego produktu.
 */
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

/**
 * Pobiera całkowitą liczbę produktów w bazie danych.
 * @returns {Promise<number>} - Liczba produktów.
 */
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

/**
 * Aktualizuje dane produktu na podstawie jego ID.
 * @param {number} productId - ID produktu.
 * @param {string} name - Nowa nazwa produktu.
 * @param {string} category - Nowa kategoria produktu.
 * @param {number} price - Nowa cena produktu.
 * @param {string} description - Nowy opis produktu.
 * @returns {Promise<Object>} - Szczegóły zaktualizowanego produktu.
 */
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

/**
 * Aktualizuje status zamówienia na podstawie jego ID.
 * @param {number} orderId - ID zamówienia.
 * @param {string} status - Nowy status zamówienia.
 * @returns {Promise<Object>} - Szczegóły zaktualizowanego zamówienia.
 */
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
        console.error('Error updating order status:', error);
        throw error;
    }
};

/**
 * Pobiera wszystkie kody rabatowe z bazy danych.
 * @returns {Promise<Array>} - Lista kodów rabatowych.
 */
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

/**
 * Dodaje nowy kod rabatowy do bazy danych.
 * @param {string} code - Kod rabatowy.
 * @param {number} discount - Wysokość rabatu w procentach.
 * @param {number} admin_id - ID administratora, który dodał kod.
 * @returns {Promise<Object>} - Szczegóły dodanego kodu rabatowego.
 */
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

/**
 * Aktualizuje status aktywności produktu na podstawie jego ID.
 * @param {number} productId - ID produktu.
 * @param {boolean} status - Status aktywności produktu (true/false).
 * @returns {Promise<Object>} - Szczegóły zaktualizowanego produktu.
 */
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

/**
 * Usuwa produkt z koszyka użytkownika.
 * @param {number} productId - ID produktu.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<void>}
 */
export const removeItemFromCart = async (productId, userId) => {
    return (await pool.query('DELETE FROM products_in_carts WHERE product_id = $1 AND client_id = $2', [productId, userId]));
};

/**
 * Pobiera obraz powiązany z produktem na podstawie jego ID.
 * @param {number} id - ID produktu.
 * @returns {Promise<Object>} - Obraz produktu.
 */
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
};

/**
 * Pobiera średnią ocenę produktu na podstawie jego ID.
 * @param {number} id - ID produktu.
 * @returns {Promise<Object>} - Średnia ocena produktu.
 */
export const getProductGrade = async (id) => {
    return (await pool.query("SELECT average_rating AS average_grade FROM products_with_avg_rating WHERE product_id = $1", [id])).rows[0];
};

/**
 * Tworzy nowe zamówienie użytkownika.
 * @param {number} clientId - ID użytkownika.
 * @param {string} code - Kod rabatowy (opcjonalnie).
 * @param {string} address - Adres dostawy.
 * @param {string} city - Miasto dostawy.
 * @returns {Promise<number>} - ID utworzonego zamówienia.
 */
export const createOrder = async (clientId, code, address, city) => {
    try {
        await pool.query('BEGIN');

        const insertOrderQuery = `
      INSERT INTO "order" (client_id, date, status, discount_code, address, address_city)
      VALUES ($1, NOW(), 'pakowanie', $2, $3, $4)
      RETURNING order_id;
    `;
        const orderResult = await pool.query(insertOrderQuery, [clientId, code, address, city]);
        const orderId = orderResult.rows[0].order_id;

        const insertOrderProductQuery = `
      INSERT INTO order_product (order_id, product_id, amount)
      SELECT $1, product_id, amount
      FROM products_in_carts
      WHERE client_id = $2;
    `;
        await pool.query(insertOrderProductQuery, [orderId, clientId]);

        const deleteCartQuery = `
      DELETE FROM products_in_carts
      WHERE client_id = $1;
    `;
        await pool.query(deleteCartQuery, [clientId]);

        await pool.query('COMMIT');

        return orderId;
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error placing order:', error);
        throw error;
    }
};

/**
 * Pobiera kod rabatowy z bazy danych na podstawie jego wartości.
 * @param {string} code - Kod rabatowy.
 * @returns {Promise<Array>} - Szczegóły kodu rabatowego.
 */
export const getCode = async (code) => {
    const query = 'SELECT * FROM discount_code WHERE code = $1';
    return (await pool.query(query, [code])).rows;
};




