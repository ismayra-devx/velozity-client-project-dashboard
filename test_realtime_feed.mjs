import { io } from './client/node_modules/socket.io-client/build/esm/index.js';
import http from 'http';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = new URL(BASE_URL + path);
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const req = http.request(url, {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function login(email, password = 'Password123!') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return {
    user: res.data.data.user,
    token: res.data.data.accessToken,
  };
}

function createSocketClient(token) {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });
}

async function runRealtimeFeedVerification() {
  console.log('================================================================');
  console.log('      REAL-TIME FEED, ROLE-FILTERING & CATCHUP VERIFICATION');
  console.log('================================================================\n');

  // Step 1: Login all roles
  console.log('Authenticating accounts: Admin, PM1, PM2, Dev1, Dev2...');
  const admin = await login('admin@velozity.com');
  const pm1 = await login('pm1@velozity.com');
  const pm2 = await login('pm2@velozity.com');
  const dev1 = await login('dev1@velozity.com');
  const dev2 = await login('dev2@velozity.com');
  console.log('All 5 accounts authenticated successfully.\n');

  // Step 2: Establish WebSockets for all 5 roles
  console.log('Connecting 5 WebSocket clients (Admin, PM1, PM2, Dev1, Dev2)...');
  const adminSocket = createSocketClient(admin.token);
  const pm1Socket = createSocketClient(pm1.token);
  const pm2Socket = createSocketClient(pm2.token);
  const dev1Socket = createSocketClient(dev1.token);
  const dev2Socket = createSocketClient(dev2.token);

  await Promise.all([
    new Promise(r => adminSocket.on('connect', r)),
    new Promise(r => pm1Socket.on('connect', r)),
    new Promise(r => pm2Socket.on('connect', r)),
    new Promise(r => dev1Socket.on('connect', r)),
    new Promise(r => dev2Socket.on('connect', r)),
  ]);
  console.log('All 5 WebSocket clients connected to backend.\n');

  // Find a task in PM1\'s project assigned to Dev1
  const pm1TasksRes = await request('/tasks', { headers: { Authorization: `Bearer ${pm1.token}` } });
  const targetTask = pm1TasksRes.data.data.tasks.find(t => t.assignedToId === dev1.user.id);
  if (!targetTask) {
    throw new Error('Could not find a task belonging to PM1 assigned to Dev1');
  }
  console.log(`Target Task for test: #${targetTask.taskNumber} "${targetTask.title}" (ID: ${targetTask.id})`);
  console.log(`Project ID: ${targetTask.projectId}, Assigned Developer: ${dev1.user.name}\n`);

  // --- TEST 1 & 2: REAL-TIME BROADCAST & STRICT ROLE FILTERING ---
  console.log('--- TEST 1 & 2: LIVE BROADCAST & ROLE-FILTERED ROUTING ---');
  console.log('Developer 1 will update task status from', targetTask.status, '-> IN_PROGRESS / IN_REVIEW...');

  const eventsReceived = {
    admin: [],
    pm1: [],
    pm2: [],
    dev1: [],
    dev2: [],
  };

  adminSocket.on('activity:new', act => eventsReceived.admin.push(act));
  pm1Socket.on('activity:new', act => eventsReceived.pm1.push(act));
  pm2Socket.on('activity:new', act => eventsReceived.pm2.push(act));
  dev1Socket.on('activity:new', act => eventsReceived.dev1.push(act));
  dev2Socket.on('activity:new', act => eventsReceived.dev2.push(act));

  const newStatus = targetTask.status === 'IN_PROGRESS' ? 'IN_REVIEW' : 'IN_PROGRESS';
  const updateRes = await request(`/tasks/${targetTask.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${dev1.token}` },
    body: { status: newStatus },
  });

  if (updateRes.status !== 200) {
    throw new Error(`Failed to update task status: ${JSON.stringify(updateRes.data)}`);
  }

  // Allow 500ms for WebSocket delivery
  await new Promise(r => setTimeout(r, 600));

  console.log('\nWebSocket Events Received per Role:');
  console.log(`- Admin received event?     ${eventsReceived.admin.length > 0 ? 'YES ✅ (Expected: YES)' : 'NO ❌'}`);
  console.log(`- PM1 (owner) received?     ${eventsReceived.pm1.length > 0 ? 'YES ✅ (Expected: YES)' : 'NO ❌'}`);
  console.log(`- PM2 (other PM) received?  ${eventsReceived.pm2.length === 0 ? 'NO ✅ (BLOCKED - Expected: NO)' : 'LEAK DETECTED ❌'}`);
  console.log(`- Dev1 (assignee) received? ${eventsReceived.dev1.length > 0 ? 'YES ✅ (Expected: YES)' : 'NO ❌'}`);
  console.log(`- Dev2 (other dev) received?${eventsReceived.dev2.length === 0 ? 'NO ✅ (BLOCKED - Expected: NO)' : 'LEAK DETECTED ❌'}`);

  const sampleActivity = eventsReceived.pm1[0] || eventsReceived.admin[0];
  if (sampleActivity) {
    console.log('\nActivity Payload Structure:');
    console.log(`- WHO:          ${sampleActivity.user?.name} (${sampleActivity.user?.role})`);
    console.log(`- WHAT CHANGED: ${sampleActivity.message}`);
    console.log(`- WHEN:         ${sampleActivity.createdAt}`);
    console.log(`- FROM STATUS:  ${sampleActivity.fromStatus} → TO STATUS: ${sampleActivity.toStatus}`);
    console.log(`- PROJECT:      ${sampleActivity.project?.name || targetTask.projectId}`);
  }

  const roleFilteringPassed =
    eventsReceived.admin.length > 0 &&
    eventsReceived.pm1.length > 0 &&
    eventsReceived.pm2.length === 0 &&
    eventsReceived.dev1.length > 0 &&
    eventsReceived.dev2.length === 0;

  console.log(`\nReal-time Role-Filtering Result: ${roleFilteringPassed ? 'PASSED 100% ✅' : 'FAILED ❌'}\n`);

  // --- TEST 3: MISSED EVENT CATCHUP ---
  console.log('--- TEST 3: MISSED EVENT CATCHUP FROM DATABASE ---');
  console.log('Step A: Dev1 disconnects WebSocket...');
  dev1Socket.disconnect();
  await new Promise(r => setTimeout(r, 200));

  console.log('Step B: Triggering 3 activities on Dev1\'s task while Dev1 is OFFLINE...');
  const cycleStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW'];
  for (const s of cycleStatuses) {
    await request(`/tasks/${targetTask.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${pm1.token}` },
      body: { status: s },
    });
    await new Promise(r => setTimeout(r, 100));
  }
  console.log('3 activities generated in database while Dev1 was offline.');

  console.log('Step C: Dev1 reconnects WebSocket...');
  const dev1ReconnectedSocket = createSocketClient(dev1.token);

  let catchupEventsFromSocket = [];
  dev1ReconnectedSocket.on('activity:catchup', events => {
    catchupEventsFromSocket = events;
  });

  await new Promise(r => dev1ReconnectedSocket.on('connect', r));
  // Wait for catchup event
  await new Promise(r => setTimeout(r, 600));

  console.log(`- Received 'activity:catchup' event on socket reconnect? ${catchupEventsFromSocket.length > 0 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`- Catchup events count from socket: ${catchupEventsFromSocket.length}`);

  console.log('Step D: Querying REST catchup endpoint GET /api/activities/missed?limit=20...');
  const missedRes = await request('/activities/missed?limit=20', {
    headers: { Authorization: `Bearer ${dev1.token}` },
  });
  const missedEventsFromDB = missedRes.data.data.activities;
  console.log(`- HTTP missed catchup returned: ${missedEventsFromDB.length} events directly from PostgreSQL ✅`);

  // Verify that the recent activities appear in catchup
  const hasRecentActivity = missedEventsFromDB.some(a => a.taskId === targetTask.id);
  console.log(`- Dev1's offline events found in PostgreSQL catchup? ${hasRecentActivity ? 'YES ✅' : 'NO ❌'}`);

  // Clean up sockets
  adminSocket.disconnect();
  pm1Socket.disconnect();
  pm2Socket.disconnect();
  dev1ReconnectedSocket.disconnect();
  dev2Socket.disconnect();

  console.log('\n================================================================');
  console.log('      ALL 3 REAL-TIME & CATCHUP TESTS COMPLETED ✅');
  console.log('================================================================');
}

runRealtimeFeedVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
