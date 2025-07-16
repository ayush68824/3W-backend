const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://bejewelled-pixie-b584d0.netlify.app", "https://*.netlify.app"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://bejewelled-pixie-b584d0.netlify.app", "https://*.netlify.app"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  initializeDefaultUsers();
});

// Models
const User = require('./models/User');
const ClaimHistory = require('./models/ClaimHistory');

// Initialize default users if database is empty
async function initializeDefaultUsers() {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      const defaultUsers = [
        { name: 'Rahul', totalPoints: 0 },
        { name: 'Kamal', totalPoints: 0 },
        { name: 'Sanak', totalPoints: 0 },
        { name: 'Priya', totalPoints: 0 },
        { name: 'Amit', totalPoints: 0 },
        { name: 'Neha', totalPoints: 0 },
        { name: 'Vikram', totalPoints: 0 },
        { name: 'Anjali', totalPoints: 0 },
        { name: 'Rajesh', totalPoints: 0 },
        { name: 'Sneha', totalPoints: 0 }
      ];
      
      await User.insertMany(defaultUsers);
      console.log('✅ Default users initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing default users:', error);
  }
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Function to emit real-time updates
const emitLeaderboardUpdate = async () => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    const history = await ClaimHistory.find().sort({ createdAt: -1 }).limit(10);
    
    io.emit('leaderboard-update', {
      users: users,
      history: history
    });
  } catch (error) {
    console.error('Error emitting leaderboard update:', error);
  }
};

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    const user = new User({ name, totalPoints: 0 });
    await user.save();
    
    // Emit real-time update
    await emitLeaderboardUpdate();
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/users/:userId/claim', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const points = Math.floor(Math.random() * 10) + 1;
    const previousPoints = user.totalPoints;
    user.totalPoints += points;
    await user.save();

    // Create claim history
    const claimHistory = new ClaimHistory({
      userId: user._id,
      userName: user.name,
      points: points,
      previousTotalPoints: previousPoints,
      newTotalPoints: user.totalPoints
    });
    await claimHistory.save();

    // Emit real-time update
    await emitLeaderboardUpdate();

    res.json({
      message: 'Points claimed successfully',
      points: points,
      userName: user.name,
      newTotalPoints: user.totalPoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await ClaimHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 