const db = require('../db');
const { fetchGitHubActivity } = require('../services/githubService');

const mapEventType = (githubEventType) => {
  switch (githubEventType) {
    case 'PushEvent': return 'Commit';
    case 'PullRequestEvent': return 'Pull Request';
    case 'IssuesEvent': return 'Issue';
    case 'CreateEvent': return 'Repository Created';
    default: return null;
  }
};

const syncGitHub = async (req, res) => {
  const { userId, githubUsername } = req.body;
  try {
    const events = await fetchGitHubActivity(githubUsername);

    for (const event of events) {
      const activityType = mapEventType(event.type);
      if (!activityType) continue;

      await db.query(
        `INSERT INTO github_activity
          (User_Id, Repository_Name, Repository_Url, Activity_Type, Activity_Description, Activity_Date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          event.repo?.name || null,
          event.repo?.name ? `https://github.com/${event.repo.name}` : null,
          activityType,
          `${event.type} on ${event.repo?.name || 'unknown repo'}`,
          event.created_at ? new Date(event.created_at) : new Date(),
        ]
      );
    }

    res.status(200).json({ message: "GitHub activity synced successfully", count: events.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGitHubActivity = async (req, res) => {
  const { userId } = req.params;
  try {
    const rows = await db.query(
      'SELECT * FROM github_activity WHERE User_Id = ? ORDER BY Activity_Date DESC',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "No GitHub activity found for this user" });
    }
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { syncGitHub, getGitHubActivity };