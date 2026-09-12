import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { User, Task, Project } from '../types/index.js';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();

  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      const [devData, taskData, projData] = await Promise.all([
        apiRequest<{ developers: User[] }>('/clients/developers').catch(() => ({ developers: [] })),
        apiRequest<{ tasks: Task[] }>('/tasks'),
        apiRequest<{ projects: Project[] }>('/projects'),
      ]);

      const developers = devData.developers || [];
      const projectList = projData.projects || [];
      const taskList = taskData.tasks || [];

      // Collect all system users
      const userMap = new Map<string, User>();

      if (currentUser) {
        userMap.set(currentUser.id, currentUser);
      }

      projectList.forEach((p) => {
        if (p.createdBy) {
          userMap.set(p.createdBy.id, p.createdBy);
        }
      });

      developers.forEach((d) => {
        userMap.set(d.id, d);
      });

      setUsers(Array.from(userMap.values()));
      setTasks(taskList);
    } catch (err) {
      console.error('Failed loading user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const isUserOnline = (u: User) => {
    return onlineUsers.some(
      (online) => online.id === u.id || online.email.toLowerCase() === u.email.toLowerCase()
    );
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 rounded-full border border-slate-200">
              <Shield className="w-3 h-3 text-slate-500" />
              <span>Admin Access</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System accounts, role-based access control, and active sessions.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {role === 'ALL'
                ? 'All Roles'
                : role === 'PROJECT_MANAGER'
                ? 'Project Manager'
                : role === 'DEVELOPER'
                ? 'Developer'
                : 'Admin'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="dashboard-card p-16 text-center text-slate-500">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No users found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or role filters.
          </p>
        </div>
      ) : (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Name & Email</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Assigned Tasks</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const online = isUserOnline(u);
                  const userTasks = tasks.filter((t) => t.assignedToId === u.id);
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const rolePill =
                    u.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : u.role === 'PROJECT_MANAGER'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {u.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${rolePill}`}>
                          {u.role === 'PROJECT_MANAGER'
                            ? 'Project Manager'
                            : u.role === 'DEVELOPER'
                            ? 'Developer'
                            : 'Admin'}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              online ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span className={online ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-600">
                        {userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => navigate(`/tasks?assignedToId=${u.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <span>View Tasks</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
