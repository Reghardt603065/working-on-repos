const buildShareUrl = (portfolioItemUrl) => {
  const encodedUrl = encodeURIComponent(portfolioItemUrl);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
};

module.exports = { buildShareUrl };