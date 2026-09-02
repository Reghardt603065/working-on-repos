const express = require('express');
const app = express();
app.use(express.json());

const githubRoutes = require('./routes/githubRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const linkedinRoutes = require('./routes/linkedinRoutes');

app.use('/github', githubRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/linkedin', linkedinRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Person 9 Integrations Service running on port ${PORT}`));