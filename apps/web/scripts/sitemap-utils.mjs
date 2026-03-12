const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export const normalizeSiteUrl = (siteUrl) => siteUrl.replace(/\/+$/, '');

export const buildSitemapXml = (siteUrl, slugs) => {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const urls = ['/', ...slugs.map((slug) => `/posts/${slug}`)];

  return `${XML_HEADER}
<urlset xmlns="${XMLNS}">
${urls.map((url) => `  <url><loc>${normalizedSiteUrl}${url}</loc></url>`).join('\n')}
</urlset>
`;
};
