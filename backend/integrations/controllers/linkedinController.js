const db = require('../db');
const { buildShareUrl } = require('../services/linkedinService');

const updateLinkedinProfile = async (req, res) => {
  const { userId } = req.params;
  const { linkedinUrl } = req.body;
  try {
    await db.query(
      'UPDATE users SET Linkedin_Url = ? WHERE User_Id = ?',
      [linkedinUrl, userId]
    );
    res.status(200).json({ message: "LinkedIn profile URL updated", linkedinUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getShareLink = async (req, res) => {
  const { portfolioId } = req.params;
  try {
    const rows = await db.query(
      'SELECT Project_Url, Title FROM portfolio_items WHERE Portfolio_Id = ?',
      [portfolioId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Portfolio item not found" });
    }
    const item = rows[0];
    if (!item.Project_Url) {
      return res.status(400).json({ error: "This portfolio item has no URL to share" });
    }
    const shareUrl = buildShareUrl(item.Project_Url);
    res.status(200).json({ title: item.Title, shareUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { updateLinkedinProfile, getShareLink };