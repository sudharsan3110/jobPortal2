// src/components/Chat/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BackgroundGradient } from '../ui/backgroundGradient.js';
import { Button } from '../ui/button';
import { TextGenerateEffect } from '../ui/Textcolor.js';
import { Input } from '../ui/input';
import { cn } from '@/utils/cn';

const ChatMessage = ({ message, isOwnMessage }) => {
  return (
    <div className={cn(
      "flex w-full mb-4",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <BackgroundGradient
        className={cn(
          "relative max-w-[80%] rounded-lg p-4",
          isOwnMessage 
            ? "bg-blue-500 text-white mr-2" 
            : "bg-gray-100 text-gray-900 ml-2"
        )}
      >
        <TextGenerateEffect
          words={message.content}
          className="text-sm"
        />
        <span className="text-xs opacity-50 block mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </BackgroundGradient>
    </div>
  );
};

const ChatInterface = ({ applicationId, currentUserId, recipientName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post('/api/chat/initiate', {
          applicationId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setChatId(response.data._id);
        setMessages(response.data.messages || []);
        
        const wsConnection = new WebSocket(`ws://localhost:4444/ws?token=${token}`);
        
        wsConnection.onopen = () => {
          console.log('Connected to chat server');
        };

        wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'chat' && data.chatId === response.data._id) {
            setMessages(prev => [...prev, data.message]);
            scrollToBottom();
          }
        };

        setWs(wsConnection);
        setIsLoading(false);
      } catch (error) {
        console.error('Chat initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [applicationId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    try {
      ws.send(JSON.stringify({
        type: 'chat',
        chatId,
        content: newMessage
      }));

      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        sender: currentUserId,
        content: newMessage,
        timestamp: new Date()
      }]);
      
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-lg">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto h-[600px] rounded-xl shadow-lg overflow-hidden bg-white">
      {/* Chat Header */}
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          Chat with {recipientName}
        </h3>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="h-[calc(100%-130px)] overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isOwnMessage={message.sender === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form 
        onSubmit={sendMessage}
        className="h-[70px] border-t p-4 flex gap-2 items-center"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;