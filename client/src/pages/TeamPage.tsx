import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowRight,
  Mail,
  CheckSquare,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { User, Task } from '../types/index.js';

export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const loadData = async () => {
    try {
      const [devData, taskData, projData] = await Promise.all([
        apiRequest<{ developers: User[] }>('/clients/developers').catch(() => ({ developers: [] })),
        apiRequest<{ tasks: Task[] }>('/tasks'),
        apiRequest<{ projects: { createdBy?: User }[] }>('/projects'),
      ]);

      const developers = devData.developers || [];
      const projectList = projData.projects || [];
      const taskList = taskData.tasks || [];

      // Collect all distinct team members (Admin, PMs, Developers)
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

      setTeamMembers(Array.from(userMap.values()));
      setTasks(taskList);
    } catch (err) {
      console.error('Failed loading team data:', err);
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

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team</h1>
          <p className="text-xs text-slate-500 mt-1">
            Agency roster, roles, and real-time member availability.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team members..."
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

      {/* Team Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="dashboard-card p-16 text-center text-slate-500">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No team members found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or role filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const online = isUserOnline(member);
            const userTasks = tasks.filter((t) => t.assignedToId === member.id);
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const roleDisplay =
              member.role === 'PROJECT_MANAGER'
                ? 'PROJECT MANAGER'
                : member.role === 'DEVELOPER'
                ? 'DEVELOPER'
                : 'ADMIN';

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="dashboard-card p-5 cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {member.name}
                        </h3>
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          {roleDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Online status indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          online ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span className={online ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'} assigned
                  </span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {selectedMember.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMember.name}</h3>
                  <p className="text-xs text-slate-500">{selectedMember.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-800">
                  {selectedMember.role === 'PROJECT_MANAGER'
                    ? 'Project Manager'
                    : selectedMember.role === 'DEVELOPER'
                    ? 'Developer'
                    : 'Administrator'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Live Presence</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isUserOnline(selectedMember) ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span
                    className={
                      isUserOnline(selectedMember)
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-400'
                    }
                  >
                    {isUserOnline(selectedMember) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Assigned Tasks</span>
                <span className="font-semibold text-slate-800">
                  {tasks.filter((t) => t.assignedToId === selectedMember.id).length} tasks
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedMember.id;
                  setSelectedMember(null);
                  navigate(`/tasks?assignedToId=${id}`);
                }}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>View Assigned Tasks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
