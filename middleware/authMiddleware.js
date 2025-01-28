import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token" });
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        next();
    } catch (err) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
    }
};

export const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token aaa" });
    }

    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (req.user.role === "admin"){
            next();
        }
    else
        return res.status(401).json({ message: "Unauthorized access" });
    } catch (err) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
    }
};

export const generateToken = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
};