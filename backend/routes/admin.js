const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to safely convert BigInt to Number for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ));
}

// GET /api/admin/users - List all users (Admin only)
// GET /api/admin/users - List all users (Admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filterConditions = [];

    if (search) {
      filterConditions.push({
        email: {
          contains: search,
          mode: 'insensitive',
        },
      });
    }

    // Build the base query
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    
    if (search) {
      whereClauses.push(`email ILIKE $${paramIndex++}`);
      queryParams.push(`%${search}%`);
    }
    
    if (role && ['USER', 'MANAGER', 'ADMIN'].includes(role.toUpperCase())) {
      // Use explicit casting in the SQL query
      whereClauses.push(`role::text = $${paramIndex++}`);
      queryParams.push(role.toUpperCase());
    }
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    try {
      // Fetch users with counts using raw SQL
      const usersQuery = `
        SELECT 
          u.id, 
          u.email, 
          u.role, 
          u."email_verified" as "emailVerified", 
          u.created_at as "createdAt",
          (SELECT COUNT(*) FROM "Project" p WHERE p."managerId" = u.id) as "projectsOwnedCount",
          (SELECT COUNT(*) FROM "Task" t WHERE t."assigneeId" = u.id) as "tasksAssignedCount"
        FROM "users" u
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      // Count query
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM "users" u
        ${whereClause}
      `;
      
      // Execute both queries in parallel
      const [usersResult, countResult] = await Promise.all([
        prisma.$queryRawUnsafe(usersQuery, ...queryParams, parseInt(limit), skip),
        prisma.$queryRawUnsafe(countQuery, ...queryParams)
      ]);
      
      // Transform the results to match the expected format
      users = usersResult.map(user => ({
        ...user,
        _count: {
          projectsOwned: Number(user.projectsOwnedCount),
          tasksAssigned: Number(user.tasksAssignedCount)
        }
      }));
      
      totalCount = Number(countResult[0].count);
      
    } catch (error) {
      console.error('Database query error:', {
        error: error.message,
        stack: error.stack,
        query: { whereClause, queryParams, limit: parseInt(limit), skip }
      });
      throw error;
    }

    // Convert BigInt to Number before sending response
    const response = {
      success: true,
      data: {
        users: serializeBigInt(users),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: Number(totalCount),
          pages: Math.ceil(Number(totalCount) / parseInt(limit))
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
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
            _count: {
              select: {
                tasks: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tasksAssigned: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:userId/role - Update user role (Admin only)
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    if (!role || !['USER', 'MANAGER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Valid role (USER, MANAGER, ADMIN) is required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.auth.userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'You cannot change your own role'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
      message: error.message
    });
  }
});

// GET /api/admin/stats - Get system statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      usersByRole,
      tasksByStatus,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),
      prisma.task.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      prisma.task.findMany({
        take: 10,
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          project: {
            select: {
              name: true
            }
          },
          assignee: {
            select: {
              email: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProjects,
          totalTasks
        },
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {}),
        tasksByStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin statistics',
      message: error.message
    });
  }
});

module.exports = router;

