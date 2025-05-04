// create-test-config.js
const axios = require('axios');

const baseUrl = 'http://localhost:3000';

async function createTestConfig() {
  const config = {
    jiraConfig: {
      domain: "test-domain.atlassian.net",
      email: "test@example.com",
      apiToken: "test-token",
      projectKey: "TEST"
    },
    trelloConfig: {
      apiKey: "test-api-key",
      apiToken: "test-token",
      boardId: "test-board-id"
    },
    syncFrequency: "daily",
    syncDirection: "jira_to_trello"
  };

  try {
    const response = await axios.post(`${baseUrl}/api/config`, config, {
      headers: {
        'x-user-id': 'test-user',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test configuration created');
    console.log(response.data);
  } catch (error) {
    console.log(error)
    console.error('❌ Failed to create test config');
    console.error(error.response?.data || error.message);
  }
}

createTestConfig();