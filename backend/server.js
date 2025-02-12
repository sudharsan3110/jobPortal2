const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./lib/authKeys');
const http = require('http');  // Add this

// MongoDB
mongoose
  .connect("mongodb://localhost:27017/jobPortal", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((res) => console.log("Connected to DB"))
  .catch((err) => console.log(err));

// initialising directories
if (!fs.existsSync("./public")) {
  fs.mkdirSync("./public");
}
if (!fs.existsSync("./public/resume")) {
  fs.mkdirSync("./public/resume");
}
if (!fs.existsSync("./public/profile")) {
  fs.mkdirSync("./public/profile");
}

const app = express();
const port = 4444;

// Create HTTP server
const server = http.createServer(app);  // Create server here

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server: server,  // Now server is defined
  path: '/ws'
});

// Store active connections
const clients = new Map();

wss.on('connection', async (ws, req) => {
  // Extract token from query string
  const token = req.url.split('?token=')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    
    // Store connection
    clients.set(userId, ws);
    
    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      
      if (data.type === 'chat') {
        const chat = await Chat.findById(data.chatId);
        if (!chat) return;
        
        // Save message to database
        chat.messages.push({
          sender: userId,
          content: data.content
        });
        await chat.save();
        
        // Send to other participant
        const otherParticipant = chat.participants.find(p => p.toString() !== userId);
        const recipientWs = clients.get(otherParticipant.toString());
        
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'chat',
            chatId: data.chatId,
            message: {
              sender: userId,
              content: data.content,
              timestamp: new Date()
            }
          }));
        }
      }
    });
    
    ws.on('close', () => {
      clients.delete(userId);
    });
    
  } catch (err) {
    ws.close();
  }
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Setting up middlewares
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});