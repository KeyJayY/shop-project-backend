import jwt from 'jsonwebtoken';

/**
 * @function authenticateToken
 * @description Middleware uwierzytelniające użytkownika na podstawie tokenu JWT.
 * @param {Object} req - Obiekt żądania.
 * @param {Object} res - Obiekt odpowiedzi.
 * @param {Function} next - Funkcja przejścia do kolejnego middleware.
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Sprawdzenie czy nagłówek zawiera token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Brak tokenu" });
    }

    const token = authHeader.split(" ")[1];
    try {
        // Weryfikacja tokenu
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        next();
    } catch (err) {
        return res.status(401).json({ valid: false, message: "Nieprawidłowy token" });
    }
};

/**
 * @function verifyAdminToken
 * @description Middleware sprawdzające, czy użytkownik jest administratorem na podstawie tokenu JWT.
 * @param {Object} req - Obiekt żądania.
 * @param {Object} res - Obiekt odpowiedzi.
 * @param {Function} next - Funkcja przejścia do kolejnego middleware.
 */
export const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Sprawdzenie czy nagłówek zawiera token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Brak tokenu" });
    }

    const token = authHeader.split(" ")[1];
    try {
        // Weryfikacja tokenu
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Sprawdzenie roli użytkownika
        if (req.user.role === "admin") {
            next();
        } else {
            return res.status(401).json({ message: "Brak dostępu, wymagana rola administratora" });
        }
    } catch (err) {
        return res.status(401).json({ valid: false, message: "Nieprawidłowy token" });
    }
};

/**
 * @function generateToken
 * @description Generuje token JWT na podstawie podanego ładunku (payload).
 * @param {Object} payload - Dane do umieszczenia w tokenie.
 * @param {string} [expiresIn='1h'] - Czas ważności tokenu (domyślnie 1 godzina).
 * @returns {string} Wygenerowany token JWT.
 */
export const generateToken = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
};
