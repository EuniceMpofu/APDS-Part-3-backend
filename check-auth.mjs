import jwt from 'jsonwebtoken';

const checkauth = (req, res, next) => {
    try {
        const token = req.cookies.token; // Ensure token is from cookies if set that way

        if (!token) {
            return res.status(401).json({ message: "Authentication token missing" });
        }

        jwt.verify(token, process.env.JWT_SECRET || "this_secret_should_be_longer_than_it_is");
        next(); // Passes control to the next handler
    }
    catch (error) {
        res.status(401).json({
            message: "Invalid token"
        });
    }
};

export default checkauth;
