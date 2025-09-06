const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireManagerOrAdmin, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks - Get tasks for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.id;
    const userRole = req.auth.role;

    let tasks;

    if (userRole === 'ADMIN') {
      // Admin can see all tasks
      tasks = await prisma.task.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
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
      });
    } else if (userRole === 'MANAGER') {
      // Manager can see tasks from their projects
      tasks = await prisma.task.findMany({
        where: {
          project: {
            managerId: userId
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
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
      });
    } else {
      // Regular users can see tasks assigned to them
      tasks = await prisma.task.findMany({
        where: {
          assigneeId: userId
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
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
      });
    }

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: error.message
    });
  }
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.auth.id;
    const userRole = req.auth.role;

    let task;

    if (userRole === 'ADMIN') {
      // Admin can see any task
      task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          assignee: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });
    } else if (userRole === 'MANAGER') {
      // Manager can see tasks from their projects
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            managerId: userId
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          assignee: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });
    } else {
      // Regular users can see tasks assigned to them
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          assigneeId: userId
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          assignee: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Task not found or you do not have access to it'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: error.message
    });
  }
});

// POST /api/projects/:projectId/tasks - Create a new task (Manager/Admin only)
router.post('/projects/:projectId/tasks', requireManagerOrAdmin, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { title, assigneeId } = req.body;
    const userId = req.auth.id;
    const userRole = req.auth.role;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Task title is required'
      });
    }

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
        message: 'Project not found or you do not have permission to add tasks to it'
      });
    }

    // If assigneeId is provided, verify the user exists
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: parseInt(assigneeId) }
      });

      if (!assignee) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Assigned user not found'
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        assignee: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    });
  }
});

// PUT /api/tasks/:id/status - Update task status (User, Manager, Admin)
router.put('/:id/status', requireRole(['USER', 'MANAGER', 'ADMIN']), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.auth.id;
    const userRole = req.auth.role;

    if (!status || !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Valid status (TODO, IN_PROGRESS, DONE) is required'
      });
    }

    // Check if task exists and user has permission
    let task;
    if (userRole === 'ADMIN') {
      task = await prisma.task.findUnique({
        where: { id: taskId }
      });
    } else if (userRole === 'MANAGER') {
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            managerId: userId
          }
        }
      });
    } else {
      // Regular users can only update tasks assigned to them
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          assigneeId: userId
        }
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Task not found or you do not have permission to update it'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        assignee: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task status',
      message: error.message
    });
  }
});

// PUT /api/tasks/:id/assign - Re-assign a task (Manager/Admin only)
router.put('/:id/assign', requireManagerOrAdmin, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { assigneeId } = req.body;
    const userId = req.auth.id;
    const userRole = req.auth.role;

    // Check if task exists and user has permission
    let task;
    if (userRole === 'ADMIN') {
      task = await prisma.task.findUnique({
        where: { id: taskId }
      });
    } else {
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            managerId: userId
          }
        }
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Task not found or you do not have permission to reassign it'
      });
    }

    // If assigneeId is provided, verify the user exists
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: parseInt(assigneeId) }
      });

      if (!assignee) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Assigned user not found'
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: assigneeId ? parseInt(assigneeId) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            manager: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        assignee: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating task assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task assignment',
      message: error.message
    });
  }
});

// DELETE /api/tasks/:id - Delete a task (Manager/Admin only)
router.delete('/:id', requireManagerOrAdmin, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.auth.id;
    const userRole = req.auth.role;

    // Check if task exists and user has permission
    let task;
    if (userRole === 'ADMIN') {
      task = await prisma.task.findUnique({
        where: { id: taskId }
      });
    } else {
      task = await prisma.task.findFirst({
        where: {
          id: taskId,
          project: {
            managerId: userId
          }
        }
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Task not found or you do not have permission to delete it'
      });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: error.message
    });
  }
});

module.exports = router;

