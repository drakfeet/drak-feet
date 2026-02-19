const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBaseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('host');
  return `${proto}://${host}`;
}

function toAbsoluteUrl(url, baseUrl) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch (error) {
    return '';
  }
}

function isBot(userAgent) {
  const ua = String(userAgent || '').toLowerCase();
  if (!ua) return false;
  return [
    'facebookexternalhit',
    'facebot',
    'whatsapp',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'discordbot',
    'telegrambot',
    'skypeuripreview',
    'googlebot'
  ].some((token) => ua.includes(token));
}

function excerpt(text, max = 220) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.slice(0, max);
}

exports.shareMeta = onRequest({ cors: false }, async (req, res) => {
  try {
    const db = admin.firestore();
    const baseUrl = normalizeBaseUrl(req);

    const configDoc = await db.collection('config').doc('loja').get();
    const config = configDoc.exists ? (configDoc.data() || {}) : {};

    const pathSlug = String(req.path || '')
      .replace(/^\/share\/?/, '')
      .trim()
      .replace(/^\/+|\/+$/g, '');
    const slug = String(req.query.slug || pathSlug || '').trim();
    let pagina = null;
    if (slug) {
      const pageSnap = await db
        .collection('paginas')
        .where('ativo', '==', true)
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (!pageSnap.empty) {
        const doc = pageSnap.docs[0];
        pagina = { id: doc.id, ...doc.data() };
      }
    }

    const loja = String(config.nomeLoja || 'Catalogo').trim();
    const targetPath = slug
      ? `/pagina.html?slug=${encodeURIComponent(slug)}`
      : '/index.html';
    const targetUrl = `${baseUrl}${targetPath}`;

    const title = String(
      config.compartilhamentoTitulo
      || (pagina?.titulo ? `${pagina.titulo} - ${loja}` : `${loja} - Catalogo`)
    ).trim();

    const pageText = pagina?.conteudoTexto ? excerpt(pagina.conteudoTexto, 220) : '';
    const description = String(
      config.compartilhamentoDescricao
      || pageText
      || excerpt(config.footerTexto, 220)
      || 'Catalogo de produtos online'
    ).trim();

    const imageUrl = toAbsoluteUrl(
      config.compartilhamentoImagemUrl
      || config.logoUrl
      || '/assets/img/LOGO SITE.png',
      baseUrl
    );

    if (!isBot(req.get('user-agent'))) {
      res.redirect(302, targetUrl);
      return;
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).send(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="${escapeHtml(loja)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(targetUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(loja)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <link rel="canonical" href="${escapeHtml(targetUrl)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}">
</head>
<body>
  <p>Redirecionando para o catálogo...</p>
</body>
</html>`);
  } catch (error) {
    console.error('shareMeta error:', error);
    res.redirect(302, '/index.html');
  }
});
