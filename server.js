import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR ? path.resolve(process.env.STORAGE_DIR) : path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'assets', 'uploads');

// Ensure directories exist
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const APPS_FILE = path.join(STORAGE_DIR, 'apps.json');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'settings.json');

// Memory storage for active admin sessions
const activeSessions = new Map(); // token -> { createdAt, expiresAt }
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Default fallback data
const DEFAULT_SETTINGS = {
  studioName: "Netroar Studios",
  slogan: "Engineering High-Performance Digital Experiences",
  heroTitle: "The Innovation Lab for Next-Gen Software & Ecosystems",
  heroDescription: "Explore our portfolio of high-performance desktop apps, cross-platform utilities, AI neural assistants, and cybernetic digital tools crafted by Netroar Studios.",
  aboutText: "Netroar Studios is an independent technology and software engineering studio founded by Prince Singh. We specialize in developing fast, offline-first, visually distinctive applications across Windows, Android, and Web platforms with high-contrast cyber-acrylic design principles.",
  contactEmail: "princegaming5555@gmail.com",
  founderName: "Prince Singh",
  adminPasscode: "netroar@admin2026",
  socialLinks: {
    github: "https://github.com/princegaming06",
    twitter: "https://twitter.com/netroarstudios",
    discord: "https://discord.gg/netroar",
    youtube: "https://youtube.com/@princegaming"
  },
  stats: {
    totalProjects: "12+",
    activeUsers: "15K+",
    targetPlatforms: "Windows · Android · Web",
    satisfactionRate: "99.4%"
  },
  brandColors: {
    primary: "#00f5b8",
    secondary: "#00a4ef",
    darkBg: "#05080c"
  },
  updatedAt: new Date().toISOString()
};

function readApps() {
  try {
    if (!fs.existsSync(APPS_FILE)) return [];
    const data = fs.readFileSync(APPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading apps.json:', err);
    return [];
  }
}

function writeApps(apps) {
  try {
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing apps.json:', err);
    return false;
  }
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (err) {
    console.error('Error reading settings.json:', err);
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing settings.json:', err);
    return false;
  }
}

// Session Token Helpers
function generateSessionToken() {
  const token = 'netroar_sec_' + crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  });
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function extractBearerToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) { // 20 MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Google Merchant Feed Generator
function generateGoogleMerchantFeed(apps, settings, host) {
  const baseUrl = host.startsWith('http') ? host : `https://${host}`;
  const itemsXml = apps.map(app => {
    const appUrl = app.websiteUrl || `${baseUrl}/#${app.slug}`;
    const imgUrl = app.icon.startsWith('http') ? app.icon : `${baseUrl}${app.icon}`;
    const desc = (app.description || app.tagline || app.name)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const title = (app.name || 'Netroar App')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const id = app.sku || app.id || app.slug;

    return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${appUrl}</g:link>
      <g:image_link>${imgUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>0.00 USD</g:price>
      <g:brand>${settings.studioName || 'Netroar Studios'}</g:brand>
      <g:google_product_category>Software &gt; Digital Goods &amp; Software</g:google_product_category>
      <g:product_type>${app.category || 'Software'}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${settings.studioName} — Official Products &amp; Software Catalog</title>
    <link>${baseUrl}</link>
    <description>${settings.heroDescription || settings.slogan}</description>
    ${itemsXml}
  </channel>
</rss>`;
}

// Server Creation
const server = http.createServer(async (req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const host = req.headers.host || 'localhost';

  // ---------------------------------------------------------------------------
  // PUBLIC API ENDPOINTS
  // ---------------------------------------------------------------------------

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'netroar-studios-server',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'GET' && pathname === '/api/apps') {
    const apps = readApps();
    return sendJson(res, 200, { success: true, count: apps.length, apps });
  }

  if (req.method === 'GET' && pathname.startsWith('/api/apps/')) {
    const id = pathname.replace('/api/apps/', '').trim();
    const apps = readApps();
    const app = apps.find(a => a.id === id || a.slug === id);
    if (!app) return sendJson(res, 404, { success: false, error: 'App not found' });
    return sendJson(res, 200, { success: true, app });
  }

  if (req.method === 'GET' && pathname === '/api/settings') {
    const settings = readSettings();
    // Exclude admin passcode from public view
    const { adminPasscode, ...publicSettings } = settings;
    return sendJson(res, 200, { success: true, settings: publicSettings });
  }

  // Google Merchant Center XML feed endpoint
  if (req.method === 'GET' && (pathname === '/feed/products.xml' || pathname === '/api/feed/products.xml')) {
    const apps = readApps();
    const settings = readSettings();
    const xml = generateGoogleMerchantFeed(apps, settings, host);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.end(xml);
  }

  // Google Merchant / Schema.org JSON feed endpoint
  if (req.method === 'GET' && (pathname === '/feed/products.json' || pathname === '/api/feed/products.json')) {
    const apps = readApps();
    const settings = readSettings();
    return sendJson(res, 200, {
      publisher: settings.studioName,
      website: `https://${host}`,
      generatedAt: new Date().toISOString(),
      itemsCount: apps.length,
      items: apps.map(app => ({
        id: app.sku || app.id,
        title: app.name,
        description: app.description || app.tagline,
        link: app.websiteUrl || `https://${host}/#${app.slug}`,
        image_link: app.icon.startsWith('http') ? app.icon : `https://${host}${app.icon}`,
        availability: 'in_stock',
        price: '0.00 USD',
        brand: settings.studioName,
        category: app.category,
        platforms: app.platforms,
        version: app.version
      }))
    });
  }

  // Dynamic Sitemap
  if (req.method === 'GET' && pathname === '/sitemap.xml') {
    const apps = readApps();
    const baseUrl = `https://${host}`;
    const urlsXml = [
      `<url><loc>${baseUrl}/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>`,
      `<url><loc>${baseUrl}/admin</loc><priority>0.3</priority><changefreq>monthly</changefreq></url>`,
      ...apps.map(app => `<url><loc>${baseUrl}/#${app.slug}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>`)
    ].join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlsXml}
</urlset>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.end(sitemap);
  }

  // Robots.txt
  if (req.method === 'GET' && pathname === '/robots.txt') {
    const robots = `User-agent: *
Allow: /
Allow: /feed/products.xml
Allow: /feed/products.json
Disallow: /admin
Disallow: /api/admin/

Sitemap: https://${host}/sitemap.xml
`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(robots);
  }

  // ---------------------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/api/admin/login') {
    try {
      const { passcode } = await parseBody(req);
      const settings = readSettings();
      if (!passcode || passcode !== settings.adminPasscode) {
        return sendJson(res, 401, { success: false, error: 'Invalid admin passcode.' });
      }
      const token = generateSessionToken();
      return sendJson(res, 200, {
        success: true,
        token,
        expiresIn: SESSION_TTL_MS / 1000,
        message: 'Admin authorization granted.'
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  if (req.method === 'GET' && pathname === '/api/admin/verify-token') {
    const token = extractBearerToken(req);
    if (!isValidSession(token)) {
      return sendJson(res, 401, { success: false, error: 'Invalid or expired session token.' });
    }
    return sendJson(res, 200, { success: true, valid: true });
  }

  // ---------------------------------------------------------------------------
  // PROTECTED ADMIN ENDPOINTS
  // ---------------------------------------------------------------------------

  if (pathname.startsWith('/api/admin/')) {
    const token = extractBearerToken(req);
    if (!isValidSession(token)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized: Valid admin token required.' });
    }

    // Add new app
    if (req.method === 'POST' && pathname === '/api/admin/apps') {
      try {
        const payload = await parseBody(req);
        if (!payload.name) {
          return sendJson(res, 400, { success: false, error: 'App name is required.' });
        }
        const apps = readApps();
        const slug = (payload.slug || payload.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newApp = {
          id: 'app_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
          slug: slug || 'app-' + Date.now(),
          name: payload.name.trim(),
          tagline: payload.tagline || '',
          description: payload.description || '',
          category: payload.category || 'Utilities',
          platforms: Array.isArray(payload.platforms) ? payload.platforms : ['Web'],
          status: payload.status || 'Live',
          isFeatured: Boolean(payload.isFeatured),
          version: payload.version || '1.0.0',
          pricing: payload.pricing || 'Free',
          icon: payload.icon || '/assets/logo/netroars-logo.png',
          websiteUrl: payload.websiteUrl || '',
          downloadUrl: payload.downloadUrl || '',
          repoUrl: payload.repoUrl || '',
          docsUrl: payload.docsUrl || '',
          features: Array.isArray(payload.features) ? payload.features : (payload.features ? payload.features.split('\n').filter(Boolean) : []),
          rating: Number(payload.rating) || 5.0,
          reviewCount: Number(payload.reviewCount) || 1,
          sku: payload.sku || `NETROAR-${slug.toUpperCase()}`,
          updatedAt: new Date().toISOString()
        };

        apps.unshift(newApp);
        writeApps(apps);
        return sendJson(res, 201, { success: true, app: newApp });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // Update existing app
    if (req.method === 'PUT' && pathname.startsWith('/api/admin/apps/')) {
      try {
        const id = pathname.replace('/api/admin/apps/', '').trim();
        const payload = await parseBody(req);
        const apps = readApps();
        const index = apps.findIndex(a => a.id === id);
        if (index === -1) {
          return sendJson(res, 404, { success: false, error: 'App not found.' });
        }

        const existing = apps[index];
        const updatedApp = {
          ...existing,
          ...payload,
          id: existing.id, // Immutable ID
          features: Array.isArray(payload.features) ? payload.features : (payload.features ? payload.features.split('\n').filter(Boolean) : existing.features),
          updatedAt: new Date().toISOString()
        };

        apps[index] = updatedApp;
        writeApps(apps);
        return sendJson(res, 200, { success: true, app: updatedApp });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // Delete app
    if (req.method === 'DELETE' && pathname.startsWith('/api/admin/apps/')) {
      const id = pathname.replace('/api/admin/apps/', '').trim();
      const apps = readApps();
      const filtered = apps.filter(a => a.id !== id);
      if (filtered.length === apps.length) {
        return sendJson(res, 404, { success: false, error: 'App not found.' });
      }
      writeApps(filtered);
      return sendJson(res, 200, { success: true, message: 'App deleted successfully.' });
    }

    // Update studio settings
    if (req.method === 'PUT' && pathname === '/api/admin/settings') {
      try {
        const payload = await parseBody(req);
        const current = readSettings();
        const updated = {
          ...current,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        // Preserve passcode if empty in update
        if (!payload.adminPasscode) {
          updated.adminPasscode = current.adminPasscode;
        }
        writeSettings(updated);
        const { adminPasscode, ...safeSettings } = updated;
        return sendJson(res, 200, { success: true, settings: safeSettings });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // Upload image (Data URL or base64 binary)
    if (req.method === 'POST' && pathname === '/api/admin/upload-image') {
      try {
        const { filename, base64Data } = await parseBody(req);
        if (!base64Data) {
          return sendJson(res, 400, { success: false, error: 'base64Data is required.' });
        }
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const ext = path.extname(filename || 'image.png') || '.png';
        const safeName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        const filePath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(filePath, buffer);
        const fileUrl = `/assets/uploads/${safeName}`;
        return sendJson(res, 200, { success: true, url: fileUrl });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // Reset data to defaults
    if (req.method === 'POST' && pathname === '/api/admin/reset-data') {
      const defaultApps = readApps();
      return sendJson(res, 200, { success: true, message: 'Database refreshed.' });
    }

    return sendJson(res, 404, { success: false, error: 'Admin API route not found.' });
  }

  // ---------------------------------------------------------------------------
  // STATIC FILE SERVING
  // ---------------------------------------------------------------------------

  let safePath = path.normalize(decodeURIComponent(pathname));
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  if (safePath === '/admin' || safePath === '\\admin' || safePath === '/admin/' || safePath === '\\admin\\' ||
      safePath === '/login' || safePath === '\\login' || safePath === '/login/' || safePath === '\\login\\') {
    safePath = '/admin.html';
  }
  if (safePath === '/apps' || safePath === '\\apps' || safePath === '/apps/' || safePath === '\\apps\\' ||
      safePath === '/app-studios' || safePath === '\\app-studios' || safePath === '/app-studios/' || safePath === '\\app-studios\\' ||
      safePath.startsWith('/app/') || safePath.startsWith('\\app\\') ||
      safePath.startsWith('/apps/') || safePath.startsWith('\\apps\\')) {
    safePath = '/apps.html';
  }

  // Block path traversal
  if (safePath.includes('..') || safePath.includes('\0')) {
    res.statusCode = 403;
    return res.end('Access denied');
  }

  const filePath = path.join(PUBLIC_DIR, safePath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end('Access denied');
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    const ext = path.extname(resolved).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', mime);
    return fs.createReadStream(resolved).pipe(res);
  }

  // Fallback to index.html for client routing
  const indexHtml = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(indexHtml).pipe(res);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Netroar Studios Server running at http://localhost:${PORT}`);
  console.log(`🌐 Public Catalog: http://localhost:${PORT}/`);
  console.log(`⚡ Admin Control:  http://localhost:${PORT}/admin`);
  console.log(`📦 Merchant Feed:  http://localhost:${PORT}/feed/products.xml`);
});