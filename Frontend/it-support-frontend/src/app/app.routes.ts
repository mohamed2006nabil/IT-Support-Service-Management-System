import { Routes } from '@angular/router';

import { Login } from './pages/login/login';

import { Dashboard } from './pages/dashboard/dashboard';

import { Tickets } from './pages/tickets/tickets';

import { CreateTicket } from './pages/create-ticket/create-ticket';

import { Notifications } from './pages/notifications/notifications';

import { TicketDetails } from './pages/ticket-details/ticket-details';

import { AgentDashboard } from './pages/agent-dashboard/agent-dashboard';

import { authGuard } from './guards/auth-guard';

import { roleGuard } from './guards/role-guard';

import { AgentTickets } from './pages/agent-tickets/agent-tickets';

import { AgentTicketDetails } from './pages/agent-ticket-details/agent-ticket-details';

import { AgentNotifications } from './pages/agent-notifications/agent-notifications';

import { AgentTicketHistory } from './pages/agent-ticket-history/agent-ticket-history';

import { AgentLayout } from './Layouts/Agent-layout/agent-layout';

import { AdminLayout } from './Layouts/Admin-layout/admin-layout';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';

import { AdminUsers } from './pages/admin-users/admin-users';

import { AdminTickets } from './pages/admin-tickets/admin-tickets';

import { AdminCategories } from './pages/admin-categories/admin-categories';

import { AdminPriorities } from './pages/admin-priorities/admin-priorities';

import { AdminDepartments } from './pages/admin-departments/admin-departments';

import { AdminTicketHistory } from './pages/admin-ticket-history/admin-ticket-history';

import { AdminProfile } from './pages/admin-profile/admin-profile';

import { AgentProfile } from './pages/agent-profile/agent-profile';


export const routes: Routes = [

  // Login

  {
    path: '',
    component: Login
  },


  // Employee routes

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  {
    path: 'tickets',
    component: Tickets,
    canActivate: [authGuard]
  },

  {
    path: 'create-ticket',
    component: CreateTicket,
    canActivate: [authGuard]
  },

  {
    path: 'notifications',
    component: Notifications,
    canActivate: [authGuard]
  },

  {
    path: 'ticket-details/:id',
    component: TicketDetails,
    canActivate: [authGuard]
  },


  // IT Agent routes

  {
    path: 'agent',
    component: AgentLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      role: 'IT Agent'
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: AgentDashboard
      },

      {
        path: 'tickets',
        component: AgentTickets
      },

      {
        path: 'ticket-details/:id',
        component: AgentTicketDetails
      },

      {
        path: 'notifications',
        component: AgentNotifications
      },

      {
        path: 'ticket-history',
        component: AgentTicketHistory
      },

      {
        path: 'profile',
        component: AgentProfile
      }

    ]
  },


  // IT Agent legacy routes
  // Keep the existing URLs working.

  {
    path: 'agent-dashboard',
    redirectTo: 'agent/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'agent-tickets',
    redirectTo: 'agent/tickets',
    pathMatch: 'full'
  },

  {
    path: 'agent-ticket-details/:id',
    redirectTo: 'agent/ticket-details/:id',
    pathMatch: 'full'
  },

  {
    path: 'agent-notifications',
    redirectTo: 'agent/notifications',
    pathMatch: 'full'
  },

  {
    path: 'agent-ticket-history',
    redirectTo: 'agent/ticket-history',
    pathMatch: 'full'
  },

  {
    path: 'agent-profile',
    redirectTo: 'agent/profile',
    pathMatch: 'full'
  },


  // Admin layout

  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      role: 'Admin'
    },
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: AdminDashboard
      },

      {
        path: 'profile',
        component: AdminProfile
      },

      {
        path: 'users',
        component: AdminUsers
      },

      {
        path: 'tickets',
        component: AdminTickets
      },

      {
        path: 'categories',
        component: AdminCategories
      },

      {
        path: 'priorities',
        component: AdminPriorities
      },

      {
        path: 'departments',
        component: AdminDepartments
      },

      {
        path: 'ticket-history',
        component: AdminTicketHistory
      }

    ]
  },


  // Legacy admin routes
  // Keep the old URLs working.

  {
    path: 'admin-dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'admin-users',
    redirectTo: 'admin/users',
    pathMatch: 'full'
  },

  {
    path: 'admin-tickets',
    redirectTo: 'admin/tickets',
    pathMatch: 'full'
  },

  {
    path: 'admin-categories',
    redirectTo: 'admin/categories',
    pathMatch: 'full'
  },

  {
    path: 'admin-priorities',
    redirectTo: 'admin/priorities',
    pathMatch: 'full'
  },

  {
    path: 'admin-departments',
    redirectTo: 'admin/departments',
    pathMatch: 'full'
  },

  {
    path: 'admin-ticket-history',
    redirectTo: 'admin/ticket-history',
    pathMatch: 'full'
  }

];
