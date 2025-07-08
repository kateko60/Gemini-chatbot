import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// For TEMPORARY LOCAL TESTING ONLY!
// REPLACE 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' with your key from Google AI Studio.
const API_KEY = 'AIzaSyDYvxqN5AZOBYUQPx5re2X7GE_-PfZei68';

// No need for the API_KEY check here, as it's directly assigned
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


function GeminiChatbot() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatInstanceRef = useRef(null); // To persist the chat instance

  useEffect(() => {
    // Initialize chat when component mounts, assuming model is always available
    if (model) { // Still a good idea to check if model initialized, though less critical with hardcoded key
      chatInstanceRef.current = model.startChat({
        history: [], // Start with an empty history
      });
    } else {
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error: AI not initialized. Check your hardcoded API key." }] }]);
    }
  }, []);

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    if (!genAI || !model) { // Check if genAI and model were initialized
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error: AI service not available. Please check your hardcoded API key." }] }]);
        return;
    }

    const userMessage = { role: 'user', parts: [{ text: userInput }] };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setLoading(true);

    try {
      if (!chatInstanceRef.current) {
        console.error("Chat instance not initialized.");
        setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error: Chat not initialized." }] }]);
        return;
      }

      const result = await chatInstanceRef.current.sendMessage(userInput);
      const responseText = result.response.text();
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      let errorMessage = "Sorry, I couldn't process that. Please try again.";
      if (error.message.includes("API key")) {
          errorMessage = "Error: Invalid or missing API key. Please check your hardcoded key.";
      } else if (error.message.includes("quota")) {
          errorMessage = "Error: Daily quota exceeded or billing issue. Please try again later.";
      }
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1 style={{ textAlign: 'center' }}>Gemini AI Chatbot</h1>
      <div style={{ border: '1px solid #eee', height: '400px', overflowY: 'scroll', padding: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
        {chatHistory.map((message, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: message.role === 'user' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '15px',
              backgroundColor: message.role === 'user' ? '#007bff' : '#e2e2e2',
              color: message.role === 'user' ? 'white' : 'black'
            }}>
              {message.parts[0].text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#888' }}>
            Gemini is typing...
          </div>
        )}
      </div>
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message here..."
        rows="3"
        style={{ width: 'calc(100% - 22px)', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'none' }}
        disabled={loading}
      />
      <button
        onClick={sendMessage}
        disabled={loading}
        style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Send
      </button>
    </div>
  );
}

export default GeminiChatbot;