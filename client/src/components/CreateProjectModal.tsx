import React, { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { Client, Project } from '../types/index.js';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiRequest<{ clients: Client[] }>('/clients')
        .then((data) => {
          setClients(data.clients || []);
          if (data.clients && data.clients.length > 0) {
            setClientId(data.clients[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!clientId) {
      setError('Please select a client');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          clientId,
        }),
      });
      onProjectCreated(data.project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
            <p className="text-xs text-slate-500">Initiate a deliverable and link to a client.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Omnichannel E-Commerce Redesign"
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Assignment *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key project goals, scope, and deliverables..."
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
