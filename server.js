/**
 * Production Backend Service for AI Job Application Assistant
 * 
 * Features:
 * - Express REST API
 * - MongoDB Connection (Mongoose)
 * - Redis Caching
 * - Google Gemini Integration
 * - JWT Authentication
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(express.json());
app.use(cors());
app.use(helmet()); // Security headers
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiting

// --- Clients ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Database Models ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  baseCV: {
    fullName: String,
    summary: String,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }]
  }
});
const User = mongoose.model('User', userSchema);

const applicationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  jobTitle: String,
  company: String,
  jobDescription: String,
  generatedContent: {
    summary: String,
    coverLetter: String
  },
  createdAt: { type: Date, default: Date.now }
});
const Application = mongoose.model('Application', applicationSchema);

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

// Auth: Login (Mock implementation for brevity)
app.post('/api/auth/login', async (req, res) => {
  // In production: Validate password hash
  const token = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// CV: Get Base CV
app.get('/api/cv', authenticateToken, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  res.json(user ? user.baseCV : {});
});

// CV: Update Base CV
app.post('/api/cv', authenticateToken, async (req, res) => {
  await User.findOneAndUpdate(
    { email: req.user.email },
    { baseCV: req.body },
    { upsert: true }
  );
  res.sendStatus(200);
});

// AI: Generate Application
app.post('/api/generate', authenticateToken, async (req, res) => {
  try {
    const { jobDescription, baseCV } = req.body;
    
    // 1. Parse Job - Efficient prompt
    const parseResp = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Extract title and company from this JD:\n${jobDescription}` }] }],
      config: { 
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 } // Efficient
      }
    });
    
    // 2. Generate Content - Efficient system instruction
    const genResp = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `Job Description:\n${jobDescription}\n\nCandidate Profile:\n${JSON.stringify(baseCV)}` }] }],
      config: { 
        systemInstruction: "Act as a professional resume writer. Generate a tailored summary and cover letter based on the provided candidate profile and job description.",
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 } // Efficient
      }
    });
    
    const result = JSON.parse(genResp.text);
    
    // Save history
    const user = await User.findOne({ email: req.user.email });
    await Application.create({
      userId: user._id,
      jobDescription,
      generatedContent: result
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Generation Failed' });
  }
});

// Serve Frontend (Production Mode)
app.use(express.static('public'));

// --- Startup ---
const start = async () => {
  try {
    if (process.env.DB_URI) {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();