# Deployment app link
https://main-app-frontend.vercel.app/




# Main App - Project Management System

A comprehensive project management application built with Next.js frontend and Node.js backend, featuring JWT-based authentication and role-based access control.

## Architecture

```
+--------------------------------+      +---------------------------+      +------------------------------+
|      Frontend Widget           |      |      Main Application     |      |    Identity Provider (IdP)   |
| (Amazon S3)                    |      |     (Next.js Frontend)    |      | (Spring Boot Backend)        |
| - HTML/CSS/JS Login Form       |      | - Project/Task UI         |      | - User Authentication        |
| - Redirects to IdP/Main App    |      | - Role-based Views        |      | - Token Generation (JWT)     |
|                                |      | - API calls to Main Backend|      | - JWKS Endpoint              |
+----------------|---------------+      +-------------|-------------+      +----------------|-------------+
                 |                              |                                  |
                 | 1. Redirect to Login         |                                  | 4. Validate Credentials
                 |<-----------------------------+                                  |    & Issue Tokens
                 | 2. User Enters Credentials   |                                  |
                 |----------------------------->|                                  |
                 | 3. POST /api/auth/login      |                                  |
                 |---------------------------------------------------------------->|
                 |                              |                                  | 5. Return Tokens
                 |<----------------------------------------------------------------|
                 | 6. Redirect to Main App      |                                  |
                 |    with Access Token         |                                  |
                 |----------------------------->| 7. Store Token,                |
                                                |    Fetch Data from Main Backend |
                                                +-------------|-------------+
                                                              | 8. API Request with JWT
                                                              |
                                                +-------------v-------------+
                                                | Main Application Backend  |
                                                |   (Node.js, Express)      |
                                                | - Validates JWT w/ IdP JWKS | 
                                                | - Business Logic          |
                                                | - DB Operations (Prisma)  |
                                                +-------------|-------------+
                                                              | 9. CRUD Operations
                                                              |
                                                +-------------v-------------+
                                                |   Shared PostgreSQL DB    |
                                                |      (idp_app_db)         |
                                                | - Users Table (from IdP)  |
                                                | - Projects, Tasks Tables  |
                                                +---------------------------+
```

## Features

### Backend (Node.js + Express + Prisma)
- **JWT Authentication**: Validates tokens from Spring Boot IdP using JWKS
- **Role-based Authorization**: USER, MANAGER, ADMIN roles with different permissions
- **Project Management**: Create, read, update, delete projects
- **Task Management**: Full CRUD operations for tasks with status tracking
- **Admin Panel**: User management and system statistics
- **Database**: PostgreSQL with Prisma ORM

### Frontend (Next.js + TypeScript + Tailwind CSS)
- **Modern UI**: Built with Shadcn/UI components and Tailwind CSS
- **Role-based Dashboards**: Different views for Users, Managers, and Admins
- **Real-time Updates**: SWR for data fetching and caching
- **Responsive Design**: Mobile-first approach with beautiful animations
- **State Management**: Zustand for global state management

### User Roles & Permissions

#### USER
- View assigned tasks
- Update task status (TODO → IN_PROGRESS → DONE)
- View projects where they have tasks

#### MANAGER
- All USER permissions
- Create and manage projects
- Create and assign tasks
- View all tasks in their projects
- Update task assignments

#### ADMIN
- All MANAGER permissions
- View all projects and tasks
- Manage user roles (promote/demote users)
- Access admin statistics and user management

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Spring Boot Identity Provider running on port 8080

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Update `.env` with your database URL and IdP configuration:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/idp_app_db""
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.local.example .env.local
   ```
   Update `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   NEXT_PUBLIC_IDP_URL=http://localhost:8080
   ```

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Projects
- `GET /api/projects` - Get projects (role-based filtering)
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (MANAGER/ADMIN)
- `PUT /api/projects/:id` - Update project (MANAGER/ADMIN)
- `DELETE /api/projects/:id` - Delete project (MANAGER/ADMIN)

### Tasks
- `GET /api/tasks` - Get tasks (role-based filtering)
- `GET /api/tasks/:id` - Get single task
- `POST /api/projects/:projectId/tasks` - Create task (MANAGER/ADMIN)
- `PUT /api/tasks/:id/status` - Update task status (USER/MANAGER/ADMIN)
- `PUT /api/tasks/:id/assign` - Reassign task (MANAGER/ADMIN)
- `DELETE /api/tasks/:id` - Delete task (MANAGER/ADMIN)

### Admin
- `GET /api/admin/users` - List users (ADMIN)
- `GET /api/admin/users/:id` - Get user details (ADMIN)
- `PUT /api/admin/users/:id/role` - Update user role (ADMIN)
- `GET /api/admin/stats` - Get system statistics (ADMIN)

## Database Schema

The application uses the same PostgreSQL database as the Identity Provider with additional tables:

- **users** (existing from IdP)
- **projects** - Project management
- **tasks** - Task management with status tracking

## Authentication Flow

1. User visits the main app
2. If not authenticated, redirect to IdP login
3. User logs in at IdP
4. IdP redirects back with access token
5. Frontend stores token and decodes user info
6. All API calls include JWT in Authorization header
7. Backend validates JWT using IdP's JWKS endpoint

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon
npm run db:studio  # Open Prisma Studio
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start Next.js dev server
npm run build  # Build for production
```

## Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npx prisma db push`
4. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
