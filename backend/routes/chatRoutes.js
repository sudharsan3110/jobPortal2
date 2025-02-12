const express = require('express');
const router = express.Router();
const auth = require('../lib/jwtAuth');
const Chat = require('../models/Chat');

router.post('/initiate', auth, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    /*
   
    
    */
    let chat = await Chat.findOne({ jobApplication: applicationId });
    
    if (!chat) {
      chat = new Chat({
        participants: [application.userId, application.recruiterId],
        jobApplication: applicationId
      });
      await chat.save();
    }
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name email')
      .populate('jobApplication');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});