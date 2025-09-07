const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects - Get projects based on user role
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userRole = req.auth.role;

    let projects;

    if (userRole === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          tasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (userRole === 'MANAGER') {
      projects = await prisma.project.findMany({
        where: {
          managerId: userId
        },
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          tasks: {
            include: {
              assignee: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          tasks: {
            some: {
              assigneeId: userId
            }
          }
        },
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          tasks: {
            where: {
              assigneeId: userId
            },
            include: {
              assignee: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error.message
    });
  }
});

// GET /api/projects/:id - Get a single project
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, error: 'Invalid project ID.' });
    }

    const userId = req.auth.userId;
    const userRole = req.auth.role;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: {
          select: { id: true, email: true, role: true }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: `No project exists with the ID ${projectId}`
      });
    }

    const isManagerOfProject = project.managerId === userId;
    const isUserAssignedToTask = project.tasks.some(task => task.assigneeId === userId);
    
    const hasAccess = userRole === 'ADMIN' || isManagerOfProject || isUserAssignedToTask;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this project.'
      });
    }
    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error(`Error fetching project with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project',
      message: error.message
    });
  }
});


// POST /api/projects - Create a new project (Manager/Admin only)
router.post('/', requireManagerOrAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const managerId = req.auth.userId;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Project name is required'
      });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        managerId
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        tasks: true
      }
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error.message
    });
  }
});

// PUT /api/projects/:id - Update a project (Manager/Admin only)
router.put('/:id', requireManagerOrAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { name, description } = req.body;
    const userId = req.auth.userId;
    const userRole = req.auth.role;

    // Check if project exists and user has permission
    let project;
    if (userRole === 'ADMIN') {
      project = await prisma.project.findUnique({
        where: { id: projectId }
      });
    } else {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          managerId: userId
        }
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: 'Project not found or you do not have permission to update it'
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name?.trim() || project.name,
        description: description?.trim() || project.description
      },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      message: error.message
    });
  }
});

// DELETE /api/projects/:id - Delete a project (Manager/Admin only)
router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.auth.userId;
    const userRole = req.auth.role;

    // Check if project exists and user has permission
    let project;
    if (userRole === 'ADMIN') {
      project = await prisma.project.findUnique({
        where: { id: projectId }
      });
    } else {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          managerId: userId
        }
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: 'Project not found or you do not have permission to delete it'
      });
    }

    // Delete all tasks first, then the project
    await prisma.task.deleteMany({
      where: { projectId }
    });

    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      message: error.message
    });
  }
});

// Helper to check if user is manager or admin
const isManagerOrAdmin = (user) => {
  return user && (user.role === 'MANAGER' || user.role === 'ADMIN');
};

// Create a new task in a project
router.post('/:projectId/tasks', requireManagerOrAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { title, assigneeId } = req.body;
  const numericProjectId = parseInt(projectId);
  const numericAssigneeId = assigneeId ? parseInt(assigneeId) : null;

  try {
    // Validate project ID
    if (!projectId || isNaN(numericProjectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
        message: 'A valid project ID is required to create a task'
      });
    }

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task title',
        message: 'Task title must be at least 3 characters long'
      });
    }

    // Verify project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { id: numericProjectId },
      select: { id: true, managerId: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: `Project with ID ${projectId} does not exist`
      });
    }

    // If assignee ID is provided, verify the user exists and is a regular user
    if (numericAssigneeId) {
      // First get the user
      const assignee = await prisma.user.findUnique({
        where: { id: numericAssigneeId },
        select: { 
          id: true,
          role: true 
        }
      });
      
      // Then check the role in JavaScript
      if (!assignee || assignee.role !== 'USER') {
        return res.status(400).json({
          success: false,
          error: 'Invalid assignee',
          message: 'The specified assignee does not exist or cannot be assigned tasks'
        });
      }
    }

    console.log('Creating task with data:', {
      title: title.trim(),
      projectId: numericProjectId,
      assigneeId: numericAssigneeId,
      status: 'TODO'
    });

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId: numericProjectId,
        assigneeId: numericAssigneeId,
        status: 'TODO'
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log('Task created successfully:', task);

    return res.status(201).json({
      success: true,
      data: {
        task: task
      }
    });

  } catch (error) {
    console.error('Error creating task:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get assignable users for a specific project
router.get('/:projectId/assignable-users', async (req, res) => {
  const { projectId } = req.params;
  const numericProjectId = parseInt(projectId);
  
  console.log(`=== /projects/${projectId}/assignable-users endpoint called ===`);
  
  try {
    // Check authentication
    if (!req.auth) {
      console.error('No auth object found in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
    }
    
    // Check authorization
    if (!isManagerOrAdmin(req.auth)) {
      console.error('User is not authorized:', req.auth);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You must be a manager or admin to access this resource'
      });
    }
    
    // Validate project ID
    if (!projectId || isNaN(numericProjectId)) {
      console.error('Invalid project ID:', projectId);
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
        message: 'A valid project ID is required to fetch assignable users'
      });
    }
    
    // First, verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: numericProjectId },
      select: { id: true, managerId: true }
    });
    
    if (!project) {
      console.error('Project not found:', projectId);
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: `Project with ID ${projectId} does not exist`
      });
    }
    
    // Find all users who can be assigned to tasks in this project
    // In this schema, any user with role 'USER' can be assigned tasks
    console.log('Fetching assignable users for project:', projectId);
    
    // First, get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    // Filter to only include users with role 'USER'
    const users = allUsers.filter(user => user.role === 'USER');
    
    console.log('All users:', JSON.stringify(allUsers, null, 2));
    
    console.log('Found users:', JSON.stringify(users, null, 2));
    
    const response = {
      success: true,
      data: {
        users: users
      }
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error fetching assignable users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignable users',
      message: error.message
    });
  }
});

module.exports = router;

