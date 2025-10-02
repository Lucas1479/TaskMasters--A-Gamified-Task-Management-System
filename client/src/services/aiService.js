import axios from 'axios';

const getConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const suggestTasks = async (prompt, token) => {
  const { data } = await axios.post('/api/ai/tasks/suggest', { prompt }, getConfig(token));
  return data; // { tasks: [...] }
};

export const createTasksFromDrafts = async (drafts, token) => {
  // Create cards? No, directly create Tasks requires a card per current backend flow.
  // Minimal intrusion: create blank Cards in-memory is not supported; instead we submit tasks WITHOUT equipping – but server requires cardUsed.
  // So we will create TaskTemplates and let user equip later? Simpler: save as templates for now.
};

export default { suggestTasks };


