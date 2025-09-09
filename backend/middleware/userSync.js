const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const syncUser = async (req, res, next) => {
  if (!req.auth || !req.auth.userId || !req.auth.sub) {
    return next();
  }

  const { userId, sub: email, role } = req.auth;

  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: email,
      },
      create: {
        id: userId,
        email: email,
        role: role,
        emailVerified: true,
        createdAt: new Date(),
      },
    });
    
    next();
  } catch (error) {
    console.error(`Failed to sync user ${userId} to local database:`, error);
    next();
  }
};

module.exports = { syncUser };