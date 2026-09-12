import { User, Project, Task, ActivityItem, Client, DashboardMetrics } from '../types/index.js';

export const DEMO_USERS: User[] = [
  { id: 'usr_admin', name: 'Sarah Connor', email: 'admin@velozity.com', role: 'ADMIN' },
  { id: 'usr_pm1', name: 'Jordan Lee', email: 'pm1@velozity.com', role: 'PROJECT_MANAGER' },
  { id: 'usr_pm2', name: 'Elena Rostova', email: 'pm2@velozity.com', role: 'PROJECT_MANAGER' },
  { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com', role: 'DEVELOPER' },
  { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com', role: 'DEVELOPER' },
  { id: 'usr_dev3', name: 'Marcus Chen', email: 'dev3@velozity.com', role: 'DEVELOPER' },
  { id: 'usr_dev4', name: 'Priya Patel', email: 'dev4@velozity.com', role: 'DEVELOPER' },
];

export const DEMO_CLIENTS: Client[] = [
  { id: 'cl_1', name: 'Acme Health Systems', company: 'Acme Health Inc.', email: 'partners@acmehealth.com', phone: '+1-555-0192' },
  { id: 'cl_2', name: 'NovaTech Solutions', company: 'NovaTech Group', email: 'contact@novatech.io', phone: '+1-555-0184' },
  { id: 'cl_3', name: 'Zenith Global Retail', company: 'Zenith Brands Ltd.', email: 'commerce@zenithbrands.com', phone: '+1-555-0177' },
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Omnichannel E-Commerce Redesign',
    description: 'Unified multi-brand digital storefront with headless CMS and real-time inventory.',
    status: 'ACTIVE',
    clientId: 'cl_3',
    client: DEMO_CLIENTS[2],
    createdById: 'usr_pm1',
    createdBy: DEMO_USERS[1],
    _count: { tasks: 6 },
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_2',
    name: 'NextGen Telehealth Portal',
    description: 'End-to-end HIPAA compliant patient-doctor teleconsultation suite.',
    status: 'ACTIVE',
    clientId: 'cl_1',
    client: DEMO_CLIENTS[0],
    createdById: 'usr_pm1',
    createdBy: DEMO_USERS[1],
    _count: { tasks: 6 },
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj_3',
    name: 'Cloud Infrastructure Modernization',
    description: 'Zero-downtime migration of multi-region microservices to Kubernetes.',
    status: 'ACTIVE',
    clientId: 'cl_2',
    client: DEMO_CLIENTS[1],
    createdById: 'usr_pm2',
    createdBy: DEMO_USERS[2],
    _count: { tasks: 6 },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let demoTasks: Task[] = [
  // Project 1 (PM1)
  {
    id: 'task_1',
    taskNumber: 1,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'Implement WebRTC Video Signaling Server',
    description: 'Build low-latency peer connection signaling using WebSockets and STUN/TURN fallback.',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    isOverdue: true,
    assignedToId: 'usr_dev1',
    assignedTo: { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com' },
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_2',
    taskNumber: 2,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'HIPAA Data Encryption at Rest Pipeline',
    description: 'Integrate envelope encryption for sensitive patient health records before DB commit.',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    isOverdue: true,
    assignedToId: 'usr_dev2',
    assignedTo: { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com' },
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_3',
    taskNumber: 3,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'Patient Appointment Scheduling Modal',
    description: 'Interactive calendar widget with timezone detection and provider slot locking.',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev1',
    assignedTo: { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com' },
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_4',
    taskNumber: 4,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'Stripe Billing & Insurance Co-pay Integration',
    description: 'Webhook listeners for synchronous credit card processing and claim submissions.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev3',
    assignedTo: { id: 'usr_dev3', name: 'Marcus Chen', email: 'dev3@velozity.com' },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_5',
    taskNumber: 5,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'Auth0 Federated Single Sign-On',
    description: 'Configured SAML & OpenID Connect endpoints for hospital enterprise staff.',
    status: 'DONE',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev1',
    assignedTo: { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com' },
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_6',
    taskNumber: 6,
    projectId: 'proj_1',
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign', createdById: 'usr_pm1' },
    title: 'Automated Audit Logging & Export Service',
    description: 'Export immutable access audit logs into partitioned secure cold storage.',
    status: 'TODO',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev4',
    assignedTo: { id: 'usr_dev4', name: 'Priya Patel', email: 'dev4@velozity.com' },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Project 2 (PM1)
  {
    id: 'task_7',
    taskNumber: 7,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'Terraform AWS EKS Cluster Provisioning',
    description: 'Multi-AZ node groups with spot instance auto-scaling configuration.',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev2',
    assignedTo: { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com' },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_8',
    taskNumber: 8,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'Prometheus & Grafana Observability Dashboards',
    description: 'Cluster metrics scraping, custom ingress latency alerts, and Slack integration.',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev3',
    assignedTo: { id: 'usr_dev3', name: 'Marcus Chen', email: 'dev3@velozity.com' },
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_9',
    taskNumber: 9,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'ArgoCD GitOps Continuous Deployment Pipeline',
    description: 'Declarative GitOps sync for staging and production Kubernetes namespaces.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev2',
    assignedTo: { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com' },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_10',
    taskNumber: 10,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'PostgreSQL Read-Replica Load Balancing',
    description: 'PgBouncer connection pooling with read-write query splitting.',
    status: 'TODO',
    priority: 'CRITICAL',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev4',
    assignedTo: { id: 'usr_dev4', name: 'Priya Patel', email: 'dev4@velozity.com' },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_11',
    taskNumber: 11,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'Disaster Recovery Automated Snapshot Validation',
    description: 'Daily automated snapshot restore testing to verify 15-minute RTO/RPO targets.',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev1',
    assignedTo: { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com' },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_12',
    taskNumber: 12,
    projectId: 'proj_2',
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal', createdById: 'usr_pm1' },
    title: 'Network Security Group & WAF Rules Hardening',
    description: 'Block malicious IP ranges and apply strict rate limiting on public endpoints.',
    status: 'DONE',
    priority: 'LOW',
    dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev3',
    assignedTo: { id: 'usr_dev3', name: 'Marcus Chen', email: 'dev3@velozity.com' },
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Project 3 (PM2)
  {
    id: 'task_13',
    taskNumber: 13,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Elasticsearch Catalog Auto-Complete Engine',
    description: 'Typo-tolerant instant search with faceted category filtering and synonym support.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev4',
    assignedTo: { id: 'usr_dev4', name: 'Priya Patel', email: 'dev4@velozity.com' },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_14',
    taskNumber: 14,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Headless Checkout with Apple Pay & Google Pay',
    description: 'One-tap mobile checkout flow minimizing cart abandonment rates.',
    status: 'IN_REVIEW',
    priority: 'CRITICAL',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev3',
    assignedTo: { id: 'usr_dev3', name: 'Marcus Chen', email: 'dev3@velozity.com' },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_15',
    taskNumber: 15,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Real-Time Inventory Webhook Dispatcher',
    description: 'Broadcast warehouse inventory count changes to frontend storefront in under 500ms.',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev2',
    assignedTo: { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com' },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_16',
    taskNumber: 16,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Customer Loyalty Points Ledger',
    description: 'Double-entry bookkeeping table for bonus points earned and redeemed during checkout.',
    status: 'DONE',
    priority: 'LOW',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev4',
    assignedTo: { id: 'usr_dev4', name: 'Priya Patel', email: 'dev4@velozity.com' },
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_17',
    taskNumber: 17,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Personalized Product Recommendation Carousel',
    description: 'Collaborative filtering model suggesting complementary accessories on product pages.',
    status: 'TODO',
    priority: 'LOW',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev1',
    assignedTo: { id: 'usr_dev1', name: 'Ravi Sharma', email: 'dev1@velozity.com' },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_18',
    taskNumber: 18,
    projectId: 'proj_3',
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization', createdById: 'usr_pm2' },
    title: 'Mobile Responsive Navigation & Sticky Footer',
    description: 'TailwindCSS modern drawer menu with smooth gesture animations on iOS and Android.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    isOverdue: false,
    assignedToId: 'usr_dev2',
    assignedTo: { id: 'usr_dev2', name: 'Arjun Mehta', email: 'dev2@velozity.com' },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let demoActivities: ActivityItem[] = [
  {
    id: 'act_1',
    taskId: 'task_3',
    projectId: 'proj_1',
    action: 'STATUS_UPDATE',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'IN_REVIEW',
    message: 'Ravi Sharma moved Task #3 from In Progress → In Review · 2 mins ago',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    user: { id: 'usr_dev1', name: 'Ravi Sharma', role: 'DEVELOPER' },
    task: { id: 'task_3', taskNumber: 3, title: 'Patient Appointment Scheduling Modal', assignedToId: 'usr_dev1' },
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign' },
  },
  {
    id: 'act_2',
    taskId: 'task_1',
    projectId: 'proj_1',
    action: 'OVERDUE_FLAGGED',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'IN_PROGRESS',
    message: 'System flagged Task #1 ("Implement WebRTC Video Signaling Server") as Overdue',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    user: { id: 'usr_pm1', name: 'Jordan Lee', role: 'PROJECT_MANAGER' },
    task: { id: 'task_1', taskNumber: 1, title: 'Implement WebRTC Video Signaling Server', assignedToId: 'usr_dev1' },
    project: { id: 'proj_1', name: 'Omnichannel E-Commerce Redesign' },
  },
  {
    id: 'act_3',
    taskId: 'task_8',
    projectId: 'proj_2',
    action: 'STATUS_UPDATE',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'IN_REVIEW',
    message: 'Marcus Chen moved Task #8 from In Progress → In Review',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    user: { id: 'usr_dev3', name: 'Marcus Chen', role: 'DEVELOPER' },
    task: { id: 'task_8', taskNumber: 8, title: 'Prometheus & Grafana Observability Dashboards', assignedToId: 'usr_dev3' },
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal' },
  },
  {
    id: 'act_4',
    taskId: 'task_14',
    projectId: 'proj_3',
    action: 'STATUS_UPDATE',
    fromStatus: 'IN_PROGRESS',
    toStatus: 'IN_REVIEW',
    message: 'Marcus Chen moved Task #14 from In Progress → In Review',
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    user: { id: 'usr_dev3', name: 'Marcus Chen', role: 'DEVELOPER' },
    task: { id: 'task_14', taskNumber: 14, title: 'Headless Checkout with Apple Pay & Google Pay', assignedToId: 'usr_dev3' },
    project: { id: 'proj_3', name: 'Cloud Infrastructure Modernization' },
  },
  {
    id: 'act_5',
    taskId: 'task_9',
    projectId: 'proj_2',
    action: 'STATUS_UPDATE',
    fromStatus: 'TODO',
    toStatus: 'IN_PROGRESS',
    message: 'Arjun Mehta moved Task #9 from To Do → In Progress',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    user: { id: 'usr_dev2', name: 'Arjun Mehta', role: 'DEVELOPER' },
    task: { id: 'task_9', taskNumber: 9, title: 'ArgoCD GitOps Continuous Deployment Pipeline', assignedToId: 'usr_dev2' },
    project: { id: 'proj_2', name: 'NextGen Telehealth Portal' },
  },
];

let currentSessionUser: User | null = null;

export function handleDemoRequest<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/api/, '');

  // 1. Auth: Login
  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    const body = JSON.parse(typeof options.body === 'string' ? options.body : '{}');
    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === (body.email || '').toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }
    currentSessionUser = user;
    return {
      user,
      accessToken: `demo_jwt_token_${user.id}_${Date.now()}`,
    } as unknown as T;
  }

  // 2. Auth: Refresh
  if (cleanEndpoint === '/auth/refresh' && method === 'POST') {
    if (!currentSessionUser) {
      // Default to Sarah Connor on first live landing if requested
      currentSessionUser = DEMO_USERS[0];
    }
    return {
      user: currentSessionUser,
      accessToken: `demo_jwt_token_${currentSessionUser.id}_${Date.now()}`,
    } as unknown as T;
  }

  // 3. Auth: Logout
  if (cleanEndpoint === '/auth/logout' && method === 'POST') {
    currentSessionUser = null;
    return { success: true } as unknown as T;
  }

  const currentUser = currentSessionUser || DEMO_USERS[0];

  // 4. Dashboard Metrics
  if (cleanEndpoint.startsWith('/dashboard')) {
    if (currentUser.role === 'ADMIN') {
      const metrics: DashboardMetrics = {
        role: 'ADMIN',
        totalProjects: DEMO_PROJECTS.length,
        totalUsers: DEMO_USERS.length,
        tasksByStatus: {
          TODO: demoTasks.filter((t) => t.status === 'TODO').length,
          IN_PROGRESS: demoTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          IN_REVIEW: demoTasks.filter((t) => t.status === 'IN_REVIEW').length,
          DONE: demoTasks.filter((t) => t.status === 'DONE').length,
        },
        tasksByPriority: {
          LOW: demoTasks.filter((t) => t.priority === 'LOW').length,
          MEDIUM: demoTasks.filter((t) => t.priority === 'MEDIUM').length,
          HIGH: demoTasks.filter((t) => t.priority === 'HIGH').length,
          CRITICAL: demoTasks.filter((t) => t.priority === 'CRITICAL').length,
        },
        overdueTaskCount: demoTasks.filter((t) => t.isOverdue).length,
        activeUsersOnline: 3,
      };
      return metrics as unknown as T;
    }

    if (currentUser.role === 'PROJECT_MANAGER') {
      const pmProjects = DEMO_PROJECTS.filter((p) => p.createdById === currentUser.id);
      const pmTasks = demoTasks.filter((t) => t.project?.createdById === currentUser.id);
      const metrics: DashboardMetrics = {
        role: 'PROJECT_MANAGER',
        projectsSummary: {
          total: pmProjects.length,
          projects: pmProjects,
        },
        totalTasks: pmTasks.length,
        tasksByStatus: {
          TODO: pmTasks.filter((t) => t.status === 'TODO').length,
          IN_PROGRESS: pmTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          IN_REVIEW: pmTasks.filter((t) => t.status === 'IN_REVIEW').length,
          DONE: pmTasks.filter((t) => t.status === 'DONE').length,
        },
        tasksByPriority: {
          LOW: pmTasks.filter((t) => t.priority === 'LOW').length,
          MEDIUM: pmTasks.filter((t) => t.priority === 'MEDIUM').length,
          HIGH: pmTasks.filter((t) => t.priority === 'HIGH').length,
          CRITICAL: pmTasks.filter((t) => t.priority === 'CRITICAL').length,
        },
        upcomingDueDatesThisWeek: pmTasks.filter((t) => !t.isOverdue && t.status !== 'DONE').slice(0, 4),
        overdueCount: pmTasks.filter((t) => t.isOverdue).length,
      };
      return metrics as unknown as T;
    }

    // DEVELOPER
    const devTasks = demoTasks.filter((t) => t.assignedToId === currentUser.id);
    const metrics: DashboardMetrics = {
      role: 'DEVELOPER',
      taskStats: {
        total: devTasks.length,
        todo: devTasks.filter((t) => t.status === 'TODO').length,
        inProgress: devTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        inReview: devTasks.filter((t) => t.status === 'IN_REVIEW').length,
        done: devTasks.filter((t) => t.status === 'DONE').length,
        overdue: devTasks.filter((t) => t.isOverdue).length,
      },
      assignedTasks: devTasks,
    };
    return metrics as unknown as T;
  }

  // 5. Projects
  if (cleanEndpoint.startsWith('/projects')) {
    if (currentUser.role === 'ADMIN') return { projects: DEMO_PROJECTS } as unknown as T;
    if (currentUser.role === 'PROJECT_MANAGER') {
      return { projects: DEMO_PROJECTS.filter((p) => p.createdById === currentUser.id) } as unknown as T;
    }
    // Dev sees projects they have tasks in
    const devProjectIds = new Set(demoTasks.filter((t) => t.assignedToId === currentUser.id).map((t) => t.projectId));
    return { projects: DEMO_PROJECTS.filter((p) => devProjectIds.has(p.id)) } as unknown as T;
  }

  // 6. Tasks
  if (cleanEndpoint.startsWith('/tasks')) {
    if (method === 'PATCH' && cleanEndpoint.includes('/status')) {
      const taskId = cleanEndpoint.split('/')[2];
      const body = JSON.parse(typeof options.body === 'string' ? options.body : '{}');
      const target = demoTasks.find((t) => t.id === taskId);
      if (target && body.status) {
        target.status = body.status;
        target.isOverdue = body.status === 'DONE' ? false : target.isOverdue;
      }
      return target as unknown as T;
    }

    let filtered = [...demoTasks];
    if (currentUser.role === 'DEVELOPER') {
      filtered = filtered.filter((t) => t.assignedToId === currentUser.id);
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      filtered = filtered.filter((t) => t.project?.createdById === currentUser.id);
    }
    return { tasks: filtered } as unknown as T;
  }

  // 7. Activities
  if (cleanEndpoint.startsWith('/activities')) {
    let list = [...demoActivities];
    if (currentUser.role === 'DEVELOPER') {
      list = list.filter((a) => a.task?.assignedToId === currentUser.id);
    } else if (currentUser.role === 'PROJECT_MANAGER') {
      const pmProjectIds = new Set(DEMO_PROJECTS.filter((p) => p.createdById === currentUser.id).map((p) => p.id));
      list = list.filter((a) => pmProjectIds.has(a.projectId));
    }
    return { activities: list } as unknown as T;
  }

  // 8. Notifications
  if (cleanEndpoint.startsWith('/notifications')) {
    return {
      notifications: [
        {
          id: 'notif_1',
          userId: currentUser.id,
          title: 'Task Assigned',
          message: 'Welcome to the Velozity Agency Portal.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    } as unknown as T;
  }

  // 9. Clients
  if (cleanEndpoint.startsWith('/clients')) {
    return { clients: DEMO_CLIENTS, developers: DEMO_USERS.filter((u) => u.role === 'DEVELOPER') } as unknown as T;
  }

  // 10. Users
  if (cleanEndpoint.startsWith('/users')) {
    return { users: DEMO_USERS } as unknown as T;
  }

  return {} as unknown as T;
}
