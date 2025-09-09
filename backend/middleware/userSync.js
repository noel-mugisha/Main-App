// File: backend/middleware/userSync.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const syncUser = async (req, res, next) => {
  if (!req.auth || !req.auth.userId || !req.auth.sub) {
    return next();
  }

  const { userId, sub: email, role } = req.auth;
  const emailVerified = true;

  try {
    const now = new Date();
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        role,
        emailVerified,
      },
      create: {
        id: userId,
        email,
        role,
        emailVerified,
        createdAt: now,
      },
    });
    next();
  } catch (error) {
    console.error('Failed to sync user to local database:', error);
    next();
  }
};

module.exports = { syncUser };