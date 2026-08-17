const axios = require('axios');

const fetchGitHubActivity = async (username) => {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}/events`);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch GitHub activity');
  }
};

module.exports = { fetchGitHubActivity };