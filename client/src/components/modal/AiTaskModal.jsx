import React, { useContext, useMemo, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import { Modal } from '../base/Modal';
import { suggestTasks } from '../../services/aiService';
import axios from 'axios';

export const AiTaskModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useContext(AuthContext);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');

  const token = user?.token;

  const handleSuggest = async () => {
    setLoading(true);
    setError('');
    try {
      const { tasks } = await suggestTasks(prompt, token);
      // Normalize fields
      const normalized = (tasks || []).map((t, idx) => ({
        id: `${Date.now()}-${idx}`,
        title: t.title || 'Untitled',
        description: t.description || '',
        type: t.type === 'long' ? 'long' : 'short',
        category: t.category || 'General',
        experienceReward: Number(t.experienceReward ?? 30),
        goldReward: Number(t.goldReward ?? 15),
        subTasks: Array.isArray(t.subTasks) ? t.subTasks : [],
        dueDate: t.dueDate || '',
      }));
      setDrafts(normalized);
    } catch (e) {
      setError(e?.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplates = async () => {
    if (!drafts.length) return onClose();
    setLoading(true);
    try {
      // Save each as a template; user can create actual tasks later using existing flows
      const results = [];
      for (const d of drafts) {
        const payload = {
          title: d.title,
          description: d.description,
          category: d.category,
          type: d.type,
          subTasks: d.type === 'long' ? d.subTasks : [],
        };
        const { data } = await axios.post('/api/templates', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        results.push(data);
      }
      onCreated?.(results);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (id, key, value) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [key]: value } : d)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Task Suggestions">
      <div className="flex flex-col gap-3">
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Describe what you want to accomplish in natural language..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex justify-between items-center">
          <button
            className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={handleSuggest}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Suggestions'}
          </button>

          {drafts.length > 0 && (
            <button
              className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-60"
              onClick={handleSaveAsTemplates}
              disabled={loading}
            >
              Save as Templates
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {drafts.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 max-h-80 overflow-auto">
            {drafts.map((d) => (
              <div key={d.id} className="border rounded p-2">
                <input
                  className="w-full border rounded p-1 mb-1 text-sm"
                  value={d.title}
                  onChange={(e) => handleEditDraft(d.id, 'title', e.target.value)}
                />
                <textarea
                  className="w-full border rounded p-1 mb-1 text-sm"
                  rows={2}
                  value={d.description}
                  onChange={(e) => handleEditDraft(d.id, 'description', e.target.value)}
                />
                <div className="flex gap-2 items-center text-sm">
                  <select
                    className="border rounded p-1"
                    value={d.type}
                    onChange={(e) => handleEditDraft(d.id, 'type', e.target.value)}
                  >
                    <option value="short">Short</option>
                    <option value="long">Long</option>
                  </select>
                  <input
                    className="border rounded p-1 flex-1"
                    placeholder="Category"
                    value={d.category}
                    onChange={(e) => handleEditDraft(d.id, 'category', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    className="border rounded p-1 w-24"
                    placeholder="XP"
                    value={d.experienceReward}
                    onChange={(e) => handleEditDraft(d.id, 'experienceReward', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    className="border rounded p-1 w-24"
                    placeholder="Gold"
                    value={d.goldReward}
                    onChange={(e) => handleEditDraft(d.id, 'goldReward', Number(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AiTaskModal;


