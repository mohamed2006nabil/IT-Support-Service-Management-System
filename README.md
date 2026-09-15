# IT Support & Service Management System

A full-stack IT Support and Service Management System for managing support tickets, users, agents, comments, attachments, categories, priorities, departments, notifications, and ticket history.

## Overview

The system is built as a role-based service management application with three main user roles:

- **Employee** — creates and manages their own support tickets.
- **IT Agent** — works on tickets assigned to them and manages support activity.
- **Admin** — manages users, tickets, categories, priorities, departments, and system-level administration.

The application is split into a modern Angular frontend and an ASP.NET Core Web API backend backed by SQL Server.

---

## Technology Stack

### Frontend

- Angular 22
- TypeScript
- Angular Router
- Angular HttpClient
- Angular SSR
- RxJS
- Standalone Angular components
- Responsive enterprise-style UI

### Backend

- ASP.NET Core / .NET 10
- C#
- Entity Framework Core
- SQL Server
- JWT Bearer Authentication
- Role-based authorization
- RESTful API controllers

### Database

- Microsoft SQL Server
- Entity Framework Core data access
- SQL database setup/script included with the project

---

## Project Structure

```text
IT SUPPORT AND SERVICE MANAGEMENT SYSTEM PROJECT/
│
├── Backend/
│   └── ITSupportAPI/
│       ├── Controllers/
│       ├── Data/
│       ├── DTOs/
│       ├── Models/
│       ├── Services/
│       ├── Program.cs
│       └── appsettings.json
│
├── Frontend/
│   └── it-support-frontend/
│       ├── src/
│       │   └── app/
│       │       ├── pages/
│       │       ├── Layouts/
│       │       ├── guards/
│       │       └── services/
│       ├── package.json
│       └── angular.json
│
└── Database/
    └── SQL database setup/scripts
```

> Folder names may vary slightly depending on the local project copy.

---

## Main Features

### Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Protected Angular routes
- Employee / IT Agent / Admin authorization rules
- Secure password hashing
- Login input validation
- Development JWT secret stored outside committed configuration

### Employee

- View personal dashboard
- Create support tickets
- View own tickets
- Follow ticket status
- Add comments
- Upload/download permitted attachments
- View notifications
- Manage profile information and profile photo

### IT Agent

- Agent dashboard
- View assigned tickets
- Open ticket details
- Update assigned tickets
- Add comments
- Manage permitted attachments
- View notifications
- View ticket history
- Manage profile information and profile photo

### Admin

- Admin dashboard
- User management
- Ticket management
- Category management
- Priority management
- Department management
- Ticket history
- Admin profile

### Ticket Management

Tickets support:

- Title and description
- Category
- Priority
- Status
- Employee/requester
- Assigned IT Agent
- Created/updated timestamps
- Resolution/closure information
- Ticket status history

### Comments & Attachments

- Authenticated access
- Ticket-level authorization
- Attachment size restrictions
- File extension allowlist
- Content-type validation
- Server-generated attachment filenames
- Ownership checks for employee/agent actions

---

## Security

Security was reviewed as part of the project development process.

Current security measures include:

- JWT signing key is not committed as a hardcoded secret.
- JWT configuration is validated at application startup.
- Protected API endpoints require authentication.
- Ticket actions are restricted according to the user's role and ticket ownership/assignment.
- Employee ticket creation derives the requester from the authenticated JWT.
- Comments require authentication and ticket access.
- Attachments require authentication and ticket access.
- Attachment uploads use a size limit and file allowlist.
- Uploaded attachment filenames are generated server-side.
- Login uses password hashing verification.
- Plaintext password fallback has been removed.
- Login DTO validation is enabled.
- CORS is restricted to the configured Angular development origin.

### Production Security Requirements

Before production deployment:

1. Configure a strong production JWT key through the hosting platform's secret/environment configuration.
2. Configure the production SQL Server connection string as a secret/environment variable.
3. Never commit passwords, JWT keys, database credentials, tokens, or API keys.
4. Replace local development API URLs such as `http://localhost:5058` with the production API URL.
5. Configure the production frontend origin in the backend CORS policy.
6. Use HTTPS for both frontend and backend.
7. Keep development credentials out of the production database.

---

## Local Development

### Prerequisites

Install:

- .NET 10 SDK
- Node.js / npm
- Angular CLI
- Microsoft SQL Server
- SQL Server Management Studio (recommended)

### 1. Database

Create/configure the SQL Server database and execute the project's database setup script.

Configure the backend connection string for the local SQL Server instance.

### 2. Backend

Open a terminal in:

```text
Backend/ITSupportAPI
```

Restore dependencies:

```bash
dotnet restore
```

Run the API:

```bash
dotnet run
```

The development API is currently configured around:

```text
http://localhost:5058
```

The actual port should be confirmed from the local launch configuration.

### 3. JWT Development Secret

Do not place the JWT signing secret directly in `appsettings.json`.

For local development, configure the secret using .NET User Secrets:

```bash
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "YOUR_DEVELOPMENT_SECRET_AT_LEAST_32_CHARACTERS"
```

Also configure the required JWT issuer/audience values used by the application.

### 4. Frontend

Open a second terminal in:

```text
Frontend/it-support-frontend
```

Install dependencies:

```bash
npm install
```

Run the Angular development server:

```bash
ng serve
```

Then open:

```text
http://localhost:4200
```

---

## Build

### Frontend

```bash
npm run build
```

### Backend

```bash
dotnet build
```

Always verify both projects build successfully before deployment.

---

## Application Routes

### Employee

```text
/dashboard
/tickets
/create-ticket
/notifications
/ticket-details/:id
```

### IT Agent

```text
/agent/dashboard
/agent/tickets
/agent/ticket-details/:id
/agent/notifications
/agent/ticket-history
/agent/profile
```

Legacy Agent URLs are redirected to the new Agent Layout routes.

### Admin

```text
/admin/dashboard
/admin/profile
/admin/users
/admin/tickets
/admin/categories
/admin/priorities
/admin/departments
/admin/ticket-history
```

Legacy Admin URLs are preserved through redirects.

---

## Agent Layout

The IT Agent interface uses a shared layout containing:

- Sidebar navigation
- Top navigation bar
- Agent profile menu
- Profile navigation
- Logout
- Routed Agent pages

The Agent Dashboard, Tickets, Notifications, Ticket History, Ticket Details, and Profile pages are designed to work inside this shared layout.

---

## API

The backend exposes REST endpoints under:

```text
/api/*
```

Main API areas include:

```text
/api/auth
/api/users
/api/tickets
/api/comments
/api/attachments
/api/roles
```

Additional controllers may be available depending on the current backend version.

---

## Testing

The project currently contains Angular component spec files and backend code that can be built and run locally.

Automated test coverage is currently limited and should be expanded in a later development phase.

Recommended future test coverage:

- Authentication
- Role authorization
- Ticket ownership/assignment rules
- Comment authorization
- Attachment authorization
- Ticket status transitions
- User/profile updates
- Critical API integration scenarios

---

## Deployment Architecture

The intended production architecture is:

```text
                    ┌─────────────────────┐
                    │   Angular Frontend  │
                    │      Web App        │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │ ASP.NET Core Web API │
                    │      Backend         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     SQL Server      │
                    │      Database       │
                    └─────────────────────┘
```

The production hosting provider has not been fixed yet. Deployment-specific instructions should be added once the hosting platform is selected.

---

## Production Checklist

Before going live:

- [ ] Frontend production build succeeds
- [ ] Backend production build succeeds
- [ ] Production SQL Server database is configured
- [ ] Production connection string is stored as a secret
- [ ] Production JWT key is stored as a secret
- [ ] JWT issuer/audience are configured
- [ ] Frontend API URL points to the production backend
- [ ] Backend CORS allows only the production frontend origin
- [ ] HTTPS is enabled
- [ ] Database backup strategy is configured
- [ ] Employee login tested
- [ ] IT Agent login tested
- [ ] Admin login tested
- [ ] Employee authorization tested
- [ ] Agent authorization tested
- [ ] Admin authorization tested
- [ ] Ticket creation/update/delete tested
- [ ] Comments tested
- [ ] Attachments tested
- [ ] Profile/photo upload tested
- [ ] No secrets are committed to GitHub

---

## Git Workflow

Recommended branch structure:

```text
main
└── feature/*
```

Typical workflow:

```bash
git checkout -b feature/my-change

git add .
git commit -m "Describe the change"

git push -u origin feature/my-change
```

Merge reviewed changes into `main` after verification.

---

## Deployment Status

**Current stage:** Pre-deployment / production preparation

The local application is being stabilized before the first production deployment. Deployment-specific configuration will be added after the hosting platform is selected.

---

## License

This project is currently intended as a project/application codebase.

Add the appropriate license before distributing the source code publicly.
