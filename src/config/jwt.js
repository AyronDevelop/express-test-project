import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const generateTokens = (userId) =>
{
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) =>
{
    try
    {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error)
    {
        return null;
    }
};

const verifyRefreshToken = (token) =>
{
    try
    {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error)
    {
        return null;
    }
};

export
{
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken
};
