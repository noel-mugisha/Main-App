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
      // Admin can see all projects
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
      // Manager can see projects they own
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
      // Regular users can see projects where they have assigned tasks
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
    const userId = req.auth.userId;
    const userRole = req.auth.role;

    let project;

    if (userRole === 'ADMIN') {
      // Admin can see any project
      project = await prisma.project.findUnique({
        where: { id: projectId },
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
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    } else if (userRole === 'MANAGER') {
      // Manager can see projects they own
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
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
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    } else {
      // Regular users can see projects where they have assigned tasks
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
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
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: 'Project not found or you do not have access to it'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
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

module.exports = router;

