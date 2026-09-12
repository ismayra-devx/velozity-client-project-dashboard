import { PrismaClient, Role, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Cleaning existing database records...');
  // Clean in correct foreign key order
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      name: 'Sarah Connor',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 2 Project Managers
  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@velozity.com',
      name: 'Jordan Lee',
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@velozity.com',
      name: 'Elena Rostova',
      passwordHash,
      role: Role.PROJECT_MANAGER,
    },
  });

  // 4 Developers
  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@velozity.com',
      name: 'Ravi Sharma',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@velozity.com',
      name: 'Arjun Mehta',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@velozity.com',
      name: 'Marcus Chen',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@velozity.com',
      name: 'Priya Patel',
      passwordHash,
      role: Role.DEVELOPER,
    },
  });

  console.log('[Seed] Seeding corporate clients...');
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Health Systems',
      company: 'Acme Health Inc.',
      email: 'partners@acmehealth.com',
      phone: '+1-555-0192',
    },
  });

  const clientNova = await prisma.client.create({
    data: {
      name: 'NovaTech Solutions',
      company: 'NovaTech Group',
      email: 'contact@novatech.io',
      phone: '+1-555-0184',
    },
  });

  const clientZenith = await prisma.client.create({
    data: {
      name: 'Zenith Global Retail',
      company: 'Zenith Brands Ltd.',
      email: 'commerce@zenithbrands.com',
      phone: '+1-555-0177',
    },
  });

  console.log('[Seed] Seeding projects...');
  // Project 1 - Managed by PM 1 (Jordan Lee)
  const project1 = await prisma.project.create({
    data: {
      name: 'Omnichannel E-Commerce Redesign',
      description: 'Unified multi-brand digital storefront with headless CMS and real-time inventory.',
      status: ProjectStatus.ACTIVE,
      clientId: clientZenith.id,
      createdById: pm1.id,
    },
  });

  // Project 2 - Managed by PM 1 (Jordan Lee)
  const project2 = await prisma.project.create({
    data: {
      name: 'NextGen Telehealth Portal',
      description: 'End-to-end HIPAA compliant patient-doctor teleconsultation suite.',
      status: ProjectStatus.ACTIVE,
      clientId: clientAcme.id,
      createdById: pm1.id,
    },
  });

  // Project 3 - Managed by PM 2 (Elena Rostova)
  const project3 = await prisma.project.create({
    data: {
      name: 'Cloud Infrastructure Modernization',
      description: 'Zero-downtime migration of multi-region microservices to Kubernetes.',
      status: ProjectStatus.ACTIVE,
      clientId: clientNova.id,
      createdById: pm2.id,
    },
  });

  console.log('[Seed] Seeding tasks (18+ tasks with various statuses & overdue items)...');
  const now = new Date();
  const pastDate3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastDate1d = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const futureDate2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const futureDate5d = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const futureDate10d = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // PROJECT 1 TASKS (Managed by PM 1)
  // Task 1: Overdue Task #1
  const t1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Implement WebRTC Video Signaling Server',
      description: 'Build low-latency peer connection signaling using WebSockets and STUN/TURN fallback.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate3d,
      isOverdue: true,
      assignedToId: dev1.id, // Ravi
    },
  });

  // Task 2: Overdue Task #2
  const t2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'HIPAA Data Encryption at Rest Pipeline',
      description: 'Integrate envelope encryption for sensitive patient health records before DB commit.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: pastDate1d,
      isOverdue: true,
      assignedToId: dev2.id, // Elena
    },
  });

  // Task 3: In Review
  const t3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Patient Appointment Scheduling Modal',
      description: 'Interactive calendar widget with timezone detection and provider slot locking.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2d,
      isOverdue: false,
      assignedToId: dev1.id, // Ravi
    },
  });

  // Task 4: In Progress
  const t4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Stripe Billing & Insurance Co-pay Integration',
      description: 'Webhook listeners for synchronous credit card processing and claim submissions.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate5d,
      isOverdue: false,
      assignedToId: dev3.id, // Marcus
    },
  });

  // Task 5: Done
  const t5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Auth0 Federated Single Sign-On',
      description: 'Configured SAML & OpenID Connect endpoints for hospital enterprise staff.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastDate3d,
      isOverdue: false,
      assignedToId: dev1.id, // Ravi
    },
  });

  // Task 6: To Do
  const t6 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Automated Audit Logging & Export Service',
      description: 'Export immutable access audit logs into partitioned secure cold storage.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate10d,
      isOverdue: false,
      assignedToId: dev4.id, // Priya
    },
  });

  // PROJECT 2 TASKS (Managed by PM 1)
  const t7 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Terraform AWS EKS Cluster Provisioning',
      description: 'Multi-AZ node groups with spot instance auto-scaling configuration.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate1d,
      isOverdue: false,
      assignedToId: dev2.id, // Elena
    },
  });

  const t8 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Prometheus & Grafana Observability Dashboards',
      description: 'Cluster metrics scraping, custom ingress latency alerts, and Slack integration.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate2d,
      isOverdue: false,
      assignedToId: dev3.id, // Marcus
    },
  });

  const t9 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'ArgoCD GitOps Continuous Deployment Pipeline',
      description: 'Declarative GitOps sync for staging and production Kubernetes namespaces.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate5d,
      isOverdue: false,
      assignedToId: dev2.id, // Elena
    },
  });

  const t10 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'PostgreSQL Read-Replica Load Balancing',
      description: 'PgBouncer connection pooling with read-write query splitting.',
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate5d,
      isOverdue: false,
      assignedToId: dev4.id, // Priya
    },
  });

  const t11 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Disaster Recovery Automated Snapshot Validation',
      description: 'Daily automated snapshot restore testing to verify 15-minute RTO/RPO targets.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate10d,
      isOverdue: false,
      assignedToId: dev1.id, // Ravi
    },
  });

  const t12 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: 'Network Security Group & WAF Rules Hardening',
      description: 'Block malicious IP ranges and apply strict rate limiting on public endpoints.',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: pastDate3d,
      isOverdue: false,
      assignedToId: dev3.id, // Marcus
    },
  });

  // PROJECT 3 TASKS (Managed by PM 2 - Jordan)
  const t13 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Elasticsearch Catalog Auto-Complete Engine',
      description: 'Typo-tolerant instant search with faceted category filtering and synonym support.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2d,
      isOverdue: false,
      assignedToId: dev4.id, // Priya
    },
  });

  const t14 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Headless Checkout with Apple Pay & Google Pay',
      description: 'One-tap mobile checkout flow minimizing cart abandonment rates.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate2d,
      isOverdue: false,
      assignedToId: dev3.id, // Marcus
    },
  });

  const t15 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Real-Time Inventory Webhook Dispatcher',
      description: 'Broadcast warehouse inventory count changes to frontend storefront in under 500ms.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate5d,
      isOverdue: false,
      assignedToId: dev2.id, // Elena
    },
  });

  const t16 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Customer Loyalty Points Ledger',
      description: 'Double-entry bookkeeping table for bonus points earned and redeemed during checkout.',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: pastDate1d,
      isOverdue: false,
      assignedToId: dev4.id, // Priya
    },
  });

  const t17 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Personalized Product Recommendation Carousel',
      description: 'Collaborative filtering model suggesting complementary accessories on product pages.',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate10d,
      isOverdue: false,
      assignedToId: dev1.id, // Ravi
    },
  });

  const t18 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: 'Mobile Responsive Navigation & Sticky Footer',
      description: 'TailwindCSS modern drawer menu with smooth gesture animations on iOS and Android.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate5d,
      isOverdue: false,
      assignedToId: dev2.id, // Elena
    },
  });

  console.log('[Seed] Seeding pre-existing activity log entries...');
  const logs = [
    {
      taskId: t3.id,
      projectId: project1.id,
      userId: dev1.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: 'Ravi Sharma moved Task #3 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago (as in spec example!)
    },
    {
      taskId: t1.id,
      projectId: project1.id,
      userId: pm1.id,
      action: 'OVERDUE_FLAGGED',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_PROGRESS,
      message: 'System flagged Task #1 ("Implement WebRTC Video Signaling Server") as Overdue',
      createdAt: new Date(now.getTime() - 15 * 60 * 1000),
    },
    {
      taskId: t8.id,
      projectId: project2.id,
      userId: dev3.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: 'Marcus Chen moved Task #8 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 35 * 60 * 1000),
    },
    {
      taskId: t14.id,
      projectId: project3.id,
      userId: dev3.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.IN_REVIEW,
      message: 'Marcus Chen moved Task #14 from In Progress → In Review',
      createdAt: new Date(now.getTime() - 50 * 60 * 1000),
    },
    {
      taskId: t9.id,
      projectId: project2.id,
      userId: dev2.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: 'Arjun Mehta moved Task #9 from To Do → In Progress',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      taskId: t13.id,
      projectId: project3.id,
      userId: dev4.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.TODO,
      toStatus: TaskStatus.IN_PROGRESS,
      message: 'Priya Patel moved Task #13 from To Do → In Progress',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      taskId: t5.id,
      projectId: project1.id,
      userId: dev1.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      message: 'Ravi Sharma moved Task #5 from In Review → Done',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      taskId: t7.id,
      projectId: project2.id,
      userId: dev2.id,
      action: 'STATUS_UPDATE',
      fromStatus: TaskStatus.IN_REVIEW,
      toStatus: TaskStatus.DONE,
      message: 'Arjun Mehta moved Task #7 from In Review → Done',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
  ];

  for (const log of logs) {
    await prisma.taskActivityLog.create({ data: log });
  }

  console.log('[Seed] Seeding sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: pm1.id,
        taskId: t3.id,
        title: 'Task Ready For Review',
        message: 'Ravi Sharma moved Task #3 ("Patient Appointment Scheduling Modal") to In Review',
        isRead: false,
      },
      {
        userId: pm1.id,
        taskId: t8.id,
        title: 'Task Ready For Review',
        message: 'Marcus Chen moved Task #8 ("Prometheus & Grafana Observability Dashboards") to In Review',
        isRead: false,
      },
      {
        userId: dev1.id,
        taskId: t1.id,
        title: 'Task Overdue Notice',
        message: 'Task #1 ("Implement WebRTC Video Signaling Server") is overdue',
        isRead: false,
      },
      {
        userId: pm2.id,
        taskId: t14.id,
        title: 'Task Ready For Review',
        message: 'Marcus Chen moved Task #14 ("Headless Checkout with Apple Pay & Google Pay") to In Review',
        isRead: false,
      },
    ],
  });

  console.log('---------------------------------------------------------');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('---------------------------------------------------------');
  console.log('Demo Credentials (Password for all: Password123!):');
  console.log('  Admin:           admin@velozity.com (Sarah Connor)');
  console.log('  Project Manager: pm1@velozity.com (Jordan Lee)');
  console.log('  Project Manager: pm2@velozity.com (Elena Rostova)');
  console.log('  Developer:       dev1@velozity.com (Ravi Sharma)');
  console.log('  Developer:       dev2@velozity.com (Arjun Mehta)');
  console.log('  Developer:       dev3@velozity.com (Marcus Chen)');
  console.log('  Developer:       dev4@velozity.com (Priya Patel)');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
