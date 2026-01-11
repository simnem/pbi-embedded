const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Token generation endpoint
app.post('/generateToken', async (req, res) => {
  try {
    const { name, country } = req.body;
    console.log('Received:', { name, country });
    
    // Your Power BI token logic here
    // For now, return a test response
    res.json({ 
      token: 'test-token-placeholder',
      success: true 
    });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
