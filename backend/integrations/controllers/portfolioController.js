const db = require('../db');

const getPortfolio = async (req, res) => {
  const { userId } = req.params;
  try {
    const rows = await db.query(
      'SELECT * FROM portfolio_items WHERE User_Id = ? ORDER BY Created_Date DESC',
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPortfolioItem = async (req, res) => {
  const { userId, title, description, projectUrl, technologiesUsed } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO portfolio_items (User_Id, Title, Description, Project_Url, Technologies_Used) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description, projectUrl, technologiesUsed]
    );
    const newItem = await db.query('SELECT * FROM portfolio_items WHERE Portfolio_Id = ?', [result.insertId]);
    res.status(201).json({ message: "Portfolio item added successfully", item: newItem[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePortfolioItem = async (req, res) => {
  const { id } = req.params;
  const { title, description, projectUrl, technologiesUsed } = req.body;
  try {
    await db.query(
      'UPDATE portfolio_items SET Title = ?, Description = ?, Project_Url = ?, Technologies_Used = ? WHERE Portfolio_Id = ?',
      [title, description, projectUrl, technologiesUsed, id]
    );
    const rows = await db.query('SELECT * FROM portfolio_items WHERE Portfolio_Id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Portfolio item not found" });
    }
    res.status(200).json({ message: `Portfolio item ${id} updated`, item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPortfolio, createPortfolioItem, updatePortfolioItem };