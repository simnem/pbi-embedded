const express = require('express');
const axios = require('axios');
const { ClientSecretCredential } = require('@azure/identity');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

app.use(express.json());
app.use(express.static('public'));

// === CORS ===
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// === CONFIG ===
require('dotenv').config();

const config = {
  tenantId: process.env.TENANT_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  workspaceId: process.env.WORKSPACE_ID,
  reportId: process.env.REPORT_ID,
  datasetId: process.env.DATASET_ID
};


// === GET ACCESS TOKEN ===
async function getAccessToken() {
  const credential = new ClientSecretCredential(config.tenantId, config.clientId, config.clientSecret);
  const token = await credential.getToken('https://analysis.windows.net/powerbi/api/.default');
  return token.token;
}

// === GENERATE EMBED TOKEN WITH RLS ===
app.post('/generateToken', async (req, res) => {
  try {
    console.log('Generating token...');
    const accessToken = await getAccessToken();
    console.log('Access token acquired');
    
    // Get country from frontend (or default to US)
    const country = req.body.country || 'US';
    console.log('Country:', country);
    
    const generateTokenRequest = {
      accessLevel: 'View',
      identities: [
        {
          username: country,  // NOW USES COUNTRY FOR RLS
          roles: ['CountryCode'],  // Your RLS role
          datasets: [config.datasetId]
        }
      ]
    };

    const response = await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${config.workspaceId}/reports/${config.reportId}/GenerateToken`,
      generateTokenRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Token success');
    res.json({
      embedUrl: `https://app.fabric.microsoft.com/reportEmbed?reportId=${config.reportId}&groupId=${config.workspaceId}`,
      accessToken: response.data.token,
      reportId: config.reportId
    });
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Code:', error.response?.data?.error?.code);
    console.error('Message:', error.response?.data?.error?.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));


