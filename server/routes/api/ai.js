import express from "express";
import { protect } from "../../middleware/auth.js";
import { suggestTasks } from "../../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/tasks/suggest -> returns { tasks: TaskDraft[] }
router.post("/tasks/suggest", protect, suggestTasks);

export default router;


