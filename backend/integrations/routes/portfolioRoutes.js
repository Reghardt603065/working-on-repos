const express = require('express');
const router = express.Router();
const { getPortfolio, createPortfolioItem, updatePortfolioItem } = require('../controllers/portfolioController');

router.get('/:userId', getPortfolio);
router.post('/', createPortfolioItem);
router.put('/:id', updatePortfolioItem);

module.exports = router;