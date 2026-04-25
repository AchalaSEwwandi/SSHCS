import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Roadmap from '../models/Roadmap.js';
import ChatbotSession from '../models/ChatbotSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_API_KEY = "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"; // Replace with your actual key

let modulesData = [];
try {
  const filePath = path.join(__dirname, '../modules.json');
  if (fs.existsSync(filePath)) {
    modulesData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
} catch (e) {
  console.error('Failed processing modules.json', e);
}

const extractJSON = (text) => {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON Extraction failed on text:', text);
    throw new Error('AI returned malformed JSON.');
  }
};

const callOpenRouter = async (systemPrompt, prompt, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "SLIIT GenAI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || `API Error: ${response.status}`);
      }
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error("Received empty response from AI model.");
      }
    } catch (error) {
      console.error(`OpenRouter API Error (Attempt ${attempt}):`, error.message);
      if (error.message.includes("OpenRouter Authentication Failed") || error.message.includes("401")) {
        throw error; // Fail immediately on auth errors, no retries
      }
      if (attempt === retries) {
        throw new Error(error.message || 'AI generation failed after multiple attempts.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // wait before retrying
    }
  }
};

export const getCourses = (req, res) => {
  try {
    const courses = [...new Set(modulesData.map(m => m.course).filter(Boolean))];
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getYearsAndSemesters = (req, res) => {
  try {
    const { course } = req.query;
    if (!course) return res.status(400).json({ success: false, message: 'Course is required' });
    const filtered = modulesData.filter(m => m.course === course);
    const years = [...new Set(filtered.map(m => m.year).filter(Boolean))];
    const semesters = [...new Set(filtered.map(m => m.semester).filter(Boolean))];
    res.json({ success: true, data: { years, semesters } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getModulesList = (req, res) => {
  try {
    const { course, year, semester } = req.query;
    if (!course || !year || !semester) return res.status(400).json({ success: false, message: 'course, year, and semester required' });
    const modules = modulesData.filter(m => m.course === course && m.year === year && m.semester === semester);
    res.json({ success: true, data: modules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const { moduleName } = req.body;
    const modulesArray = Array.isArray(moduleName) ? moduleName : [moduleName];
    const systemPrompt = 'You are a helpful educational AI. Generate exactly 5 multiple-choice questions FOR EACH of the provided modules. OUTPUT ONLY in raw valid JSON array format, no markdown code block tags. Format: [ { "module": "First Module Name", "questions": [ { "question": "...", "options": ["a", "b", "c"], "answer": "correct option exact string" } ] } ]';
    const modulesStr = modulesArray.join(', ');
    const text = await callOpenRouter(systemPrompt, `Generate 5 questions per module for these modules: ${modulesStr}`);
    const jsonData = extractJSON(text);
    res.json({ success: true, data: jsonData });
  } catch (e) {
    console.error('Quiz Generation Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const generateIdeas = async (req, res) => {
  try {
    const { type, moduleName, category } = req.body;
    let prompt = '';

    const modulesArray = Array.isArray(moduleName) ? moduleName : [moduleName];
    const systemPrompt = 'You are a business mentor for college students. OUTPUT ONLY in raw valid JSON array format, DO NOT output markdown code block tags. Format: [ { "title": "[Module Name] - Idea name", "description": "Short description" } ]';

    if (type === 'academic') {
      const modulesStr = modulesArray.join(', ');
      const totalIdeas = modulesArray.length * 3;
      prompt = `For EACH of the following modules (${modulesStr}), provide exactly 3 practical startup/business ideas. You must generate exactly ${totalIdeas} ideas in total. Be sure to prefix the title of each idea with the name of the module it belongs to, so they are clearly separated.`;
    } else {
      prompt = `Provide exactly 3 practical startup/business ideas related to the non-academic category: ${category}`;
    }

    const text = await callOpenRouter(systemPrompt, prompt);
    const jsonData = extractJSON(text);
    res.json({ success: true, data: jsonData });
  } catch (e) {
    console.error('Idea Generation Error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const generateRoadmap = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please relogin." });
    }

    const { idea } = req.body;
    const systemPrompt = 'You are a startup advisor. Given a business idea, provide a step-by-step roadmap for a student to launch it. Your response MUST be ONLY a raw JSON array of strings, where each string is a single step in the roadmap. Do not include markdown formatting or tags like ```json. Example: ["Do market research", "Create a business plan", "Build a prototype"]';

    const text = await callOpenRouter(systemPrompt, idea);
    let tasksArray;

    try {
      let parsed = extractJSON(text);
      if (Array.isArray(parsed)) {
        tasksArray = parsed;
      } else if (parsed && Array.isArray(parsed.tasks)) {
        tasksArray = parsed.tasks;
      } else if (parsed && Array.isArray(parsed.steps)) {
        tasksArray = parsed.steps;
      } else if (parsed && Array.isArray(parsed.roadmap)) {
        tasksArray = parsed.roadmap;
      } else {
        throw new Error("API did not return a valid array of steps.");
      }
    } catch (parseError) {
      // Fallback if parsing fails - just split it by newlines if the AI ignored JSON instructions
      tasksArray = text.split('\n')
        .filter(line => line.trim().length > 5 && !line.includes('```'))
        .map(line => line.replace(/^[\d\.\-\*]*\s*/, '').trim());
    }

    const tasksList = tasksArray.map(desc => {
      const descriptionText = typeof desc === 'object' ? (desc.title || desc.step || desc.description || JSON.stringify(desc)) : String(desc);
      return { description: descriptionText.substring(0, 500), isDone: false };
    });

    const roadmap = new Roadmap({
      userId: req.user.id,
      ideaTitle: idea,
      tasks: tasksList
    });

    await roadmap.save();

    res.json({ success: true, data: roadmap });
  } catch (e) {
    console.error('Generate Roadmap Error:', e);
    res.status(500).json({ success: false, message: e.message, stack: e.stack });
  }
};

export const getRoadmaps = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const roadmaps = await Roadmap.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskDone = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { roadmapId, taskId } = req.params;
    const { isDone } = req.body;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: req.user.id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    const task = roadmap.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.isDone = isDone;
    await roadmap.save();

    res.json({ success: true, data: roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const chat = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please login again.' });
    }

    const { message, sessionId } = req.body;
    let session = null;
    let chatHistoryContext = '';

    if (sessionId) {
      session = await ChatbotSession.findOne({ _id: sessionId, userId: req.user.id });
      if (session) {
        // Build history context for AI
        const recentMessages = session.messages.slice(-6); // last 6 messages
        chatHistoryContext = 'Previous Conversation:\n' + recentMessages.map(m => `${m.isBot ? 'AI' : 'User'}: ${m.text}`).join('\n') + '\n\n';
      }
    }

    if (!session) {
      // Create new session if none exists or invalid ID
      session = new ChatbotSession({
        userId: req.user.id,
        title: message.substring(0, 30) + '...',
        messages: []
      });
    }

    // Add user message to session
    session.messages.push({ text: message, isBot: false });

    const systemPrompt = 'You are a friendly business advisory AI for university students. ONLY answer questions related to business, entrepreneurship, startups, business ideas, and practical commerce strategies. If the user asks anything unrelated (e.g., general chit-chat, coding, random facts, math), politely turn them down with a friendly tone and remind them you are here strictly for business advice.';

    // Pass the combined context to Gemini
    const fullPrompt = `${chatHistoryContext}Current Question: ${message}`;
    const text = await callOpenRouter(systemPrompt, fullPrompt);

    // Add bot reply to session
    session.messages.push({ text: text, isBot: true });
    await session.save(); // Save once at the end strictly to prevent half-saved sessions

    res.json({ success: true, reply: text, sessionId: session._id });
  } catch (e) {
    console.error("Chat Error:", e);
    res.status(500).json({ success: false, message: e.message, stack: e.stack });
  }
};

export const getChatSessions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const sessions = await ChatbotSession.find({ userId: req.user.id })
      .select('title updatedAt createdAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getChatSessionById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const session = await ChatbotSession.findOne({ _id: req.params.sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
