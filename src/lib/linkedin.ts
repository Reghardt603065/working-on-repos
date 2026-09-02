export function buildLinkedInShareUrl(url: string) {
  const encodedUrl = encodeURIComponent(url);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
}