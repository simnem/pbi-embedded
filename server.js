const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://victorious-bay-0171f2b10.2.azurestaticapps.net',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});


// Token generation endpoint
const axios = require('axios');

app.post('/generateToken', async (req, res) => {
  try {
    const { name, country } = req.body;
    console.log('Received:', { name, country });

    // Get credentials from environment
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID;
    const workspaceId = process.env.WORKSPACE_ID;
    const reportId = process.env.REPORT_ID;

    // Step 1: Get access token from Azure AD
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://analysis.windows.net/powerbi/api/.default',
        grant_type: 'client_credentials'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('Got Azure AD token');

    // Step 2: Generate Power BI embed token
    const embedResponse = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      {
        accessLevel: 'View',
        identities: [
          {
            username: name,
            roles: ['Viewer'],
            datasets: [process.env.DATASET_ID]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const embedToken = embedResponse.data.token;
    console.log('Got embed token for:', name);

    res.json({
      token: embedToken,
      accessToken: embedToken,
      reportId: reportId,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
      workspaceId: workspaceId,
      datasetId: process.env.DATASET_ID
    });


  } catch (error) {
    console.error('Token generation error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



