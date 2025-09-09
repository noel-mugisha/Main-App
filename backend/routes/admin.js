
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios'); // <-- Import axios
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// The GET endpoints you provided remain unchanged as they are correct.
// GET /api/admin/users - List all users (Admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (role && ['USER', 'MANAGER', 'ADMIN'].includes(role.toUpperCase())) {
      where.role = { equals: role.toUpperCase() };
    }

    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { projectsOwned: true, tasksAssigned: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users', message: error.message });
  }
});

// GET /api/admin/users/:userId - Get user details (Admin only)
router.get('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        linkedinId: true,
        createdAt: true,
        projectsOwned: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasksAssigned: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user details', message: error.message });
  }
});


// PUT /api/admin/users/:userId/role (Proxy Logic)
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { role: newRole } = req.body;
    const idpApiUrl = process.env.IDP_API_URL;

    // --- Validation ---
    if (!newRole || !['USER', 'MANAGER', 'ADMIN'].includes(newRole)) {
        return res.status(400).json({ success: false, error: 'Validation error', message: 'Valid role is required' });
    }
    if (userId === req.auth.userId) {
        return res.status(400).json({ success: false, error: 'Invalid operation', message: 'You cannot change your own role' });
    }
    if (!idpApiUrl) {
        console.error("IDP_API_URL environment variable is not set.");
        return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    try {
        const idpEndpoint = `${idpApiUrl}/api/admin/users/${userId}/role`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization, 
        };

        await axios.put(idpEndpoint, { role: newRole }, { headers });

        const updatedLocalUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        res.json({
            success: true,
            data: updatedLocalUser,
            message: `User role successfully updated to ${newRole}`,
        });

    } catch (error) {
        console.error('Error in role update proxy:', error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: 'IdP Error',
                message: error.response.data?.message || 'Failed to update role in the Identity Provider.',
            });
        }
        res.status(500).json({ success: false, error: 'Internal Server Error', message: 'The request to the IdP failed.' });
    }
});


// GET /api/admin/stats - Get system statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalTasks, usersByRole, tasksByStatus, recentActivity] = await prisma.$transaction([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.task.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          project: { select: { name: true } },
          assignee: { select: { email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProjects,
          totalTasks,
        },
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {}),
        tasksByStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admin statistics', message: error.message });
  }
});

module.exports = router;