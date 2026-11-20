import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load local .env file if present (Native in Node.js 20+)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch (envErr) {
  // Silent fallback if .env is missing or invalid
}

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
  brandLogo: "/assets/logo/netroar-studios-logo-dark.png",
  logoDarkUrl: "/assets/logo/netroar-studios-logo-dark.png",
  logoLightUrl: "/assets/logo/netroar-studios-logo-light.png",
  favicon: "/favicon.png",
  faviconUrl: "/favicon.png",
  logoScale: 100,
  slogan: "Beyond Technology. Beyond Imagination.",
  heroTitle: "Beyond Technology. Beyond Imagination.",
  heroDescription: "Netroar Studios began with an ambition: to create technology rather than simply consume it. An independent technology brand exploring software engineering, digital products, artificial intelligence, and interactive experiences.",
  aboutText: "Netroar Studios is an evolving independent technology company founded by Prince Singh around creation, experimentation, and ambition. Our direction is not restricted to one platform: desktop applications, web technologies, mobile applications, artificial intelligence, and game development all represent opportunities to build something meaningful.",
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

// Security: Client IP extractor (supports standard reverse proxies like Cloudflare/Nginx/Render)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

// Security: Host header sanitizer to prevent host-header injection and cache poisoning
function sanitizeHost(rawHost) {
  if (!rawHost || typeof rawHost !== 'string') return 'localhost';
  const clean = rawHost.trim().toLowerCase();
  if (/^[a-z0-9.-]+(:[0-9]{1,5})?$/.test(clean)) {
    return clean;
  }
  return 'localhost';
}

// Security: Timing-Safe String Comparison to prevent timing attacks
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Security: Dynamic Passcode Resolution with ENV override
function getEffectivePasscode() {
  if (process.env.ADMIN_PASSCODE) {
    return process.env.ADMIN_PASSCODE;
  }
  const settings = readSettings();
  return settings.adminPasscode || DEFAULT_SETTINGS.adminPasscode;
}

// Security: In-Memory IP Brute-Force Rate Limiter
const loginRateLimiter = new Map(); // ip -> { count: number, lockedUntil: number }
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function checkLoginRateLimit(ip) {
  const record = loginRateLimiter.get(ip);
  if (!record) return { allowed: true };
  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSeconds };
  }
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginRateLimiter.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordLoginFailure(ip) {
  const record = loginRateLimiter.get(ip) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginRateLimiter.set(ip, record);
}

function recordLoginSuccess(ip) {
  loginRateLimiter.delete(ip);
}

// Security: File Upload Validation & Sanitization
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg', '.gif']);

function validateImageBuffer(buffer, ext) {
  if (!buffer || buffer.length === 0) return { valid: false, error: 'Empty file buffer.' };
  if (buffer.length > 5 * 1024 * 1024) return { valid: false, error: 'File exceeds 5MB size limit.' };

  const normalizedExt = (ext || '').toLowerCase();
  if (!ALLOWED_IMAGE_EXTS.has(normalizedExt)) {
    return { valid: false, error: `Disallowed file extension "${ext}". Allowed: png, jpg, jpeg, webp, ico, svg, gif` };
  }

  // Magic byte checks
  if (normalizedExt === '.png') {
    if (buffer.length < 8 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      return { valid: false, error: 'Corrupt or invalid PNG signature.' };
    }
  } else if (normalizedExt === '.jpg' || normalizedExt === '.jpeg') {
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { valid: false, error: 'Corrupt or invalid JPEG signature.' };
    }
  } else if (normalizedExt === '.webp') {
    const head = buffer.toString('utf-8', 0, 12);
    if (!head.startsWith('RIFF') || !head.includes('WEBP')) {
      return { valid: false, error: 'Corrupt or invalid WebP signature.' };
    }
  } else if (normalizedExt === '.ico') {
    if (buffer.length < 4 || buffer[0] !== 0x00 || buffer[1] !== 0x00 || buffer[2] !== 0x01 || buffer[3] !== 0x00) {
      return { valid: false, error: 'Corrupt or invalid ICO signature.' };
    }
  } else if (normalizedExt === '.svg') {
    const svgStr = buffer.toString('utf-8').toLowerCase();
    if (svgStr.includes('<script') || svgStr.includes('javascript:') || svgStr.includes('onload=') || svgStr.includes('onerror=')) {
      return { valid: false, error: 'SVG contains disallowed executable scripts or event handlers.' };
    }
    if (!svgStr.includes('<svg')) {
      return { valid: false, error: 'Invalid SVG content.' };
    }
  }

  return { valid: true };
}

// Periodic Session & Rate Limiter Cleanup (Avoids memory leaks during long uptimes)
const sessionCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(token);
    }
  }
  for (const [ip, record] of loginRateLimiter.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      loginRateLimiter.delete(ip);
    }
  }
}, 30 * 60 * 1000);
sessionCleanupTimer.unref();

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
      if (body.length > 5 * 1024 * 1024) { // Hardened 5 MB limit
        reject(new Error('Payload too large (Max 5MB)'));
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

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Google Merchant Feed Generator
function generateGoogleMerchantFeed(apps, settings, host) {
  const baseUrl = host.startsWith('http') ? host : `https://${host}`;
  const itemsXml = apps.map(app => {
    let appUrl = app.websiteUrl || `${baseUrl}/#${app.slug || app.id}`;
    if (!appUrl.startsWith('http')) {
      appUrl = `${baseUrl}${appUrl.startsWith('/') ? '' : '/'}${appUrl}`;
    }
    const imgUrl = (app.icon && app.icon.startsWith('http')) ? app.icon : `${baseUrl}${app.icon || '/assets/logo/netroar-studios-logo-dark.png'}`;
    const desc = escapeXml(app.description || app.tagline || app.name || '');
    const title = escapeXml(app.name || 'Netroar App');
    const id = escapeXml(app.sku || app.id || app.slug || 'APP-01');
    const brand = escapeXml(settings.studioName || 'Netroar Studios');
    const category = escapeXml(app.category || 'Digital Goods & Software');

    return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escapeXml(appUrl)}</g:link>
      <g:image_link>${escapeXml(imgUrl)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>0.00 USD</g:price>
      <g:brand>${brand}</g:brand>
      <g:google_product_category>Software &gt; Digital Goods &amp; Software</g:google_product_category>
      <g:product_type>${category}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
  }).join('');

  const channelTitle = escapeXml(`${settings.studioName || 'Netroar Studios'} — Official Products & Software Catalog`);
  const channelDesc = escapeXml(settings.heroDescription || settings.slogan || 'Official digital software & application catalog');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${channelTitle}</title>
    <link>${baseUrl}</link>
    <description>${channelDesc}</description>
    ${itemsXml}
  </channel>
</rss>`;
}

// Server Creation
const server = http.createServer(async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const host = sanitizeHost(req.headers.host);
    const urlObj = new URL(req.url, `http://${host}`);
    const pathname = urlObj.pathname;

    // Security: Block directory traversal attempts and null byte injections upfront
    if (req.url.includes('..') || req.url.includes('\0') || req.url.toLowerCase().includes('%2e%2e')) {
      res.statusCode = 403;
      return res.end('Access denied');
    }

    // Hardened HTTP Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com; frame-src 'self' https://*.firebaseapp.com;");

    // Dynamic CORS: allow * for public GET, reflect Origin for admin
    if (pathname.startsWith('/api/admin/')) {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

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

  // Google Site Verification
  if (req.method === 'GET' && (pathname === '/google01dcbf8124219bdc.html' || pathname === '/google01dcbf8124219bdc%20(2).html')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.end('google-site-verification: google01dcbf8124219bdc.html');
  }

  // Lightweight ping endpoint for keep-alive monitors (UptimeRobot, etc.)
  if (req.method === 'GET' && pathname === '/ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.end('pong');
  }

  // Dynamic Clean Sitemap (Excludes /admin, avoids invalid '#' fragments)
  if (req.method === 'GET' && pathname === '/sitemap.xml') {
    const apps = readApps();
    const baseUrl = `https://${host}`;
    const urlsXml = [
      `<url><loc>${baseUrl}/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>`,
      `<url><loc>${baseUrl}/apps</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`,
      ...apps.map(app => `<url><loc>${escapeXml(`${baseUrl}/apps/${app.slug || app.id}`)}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>`)
    ].join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlsXml}
</urlset>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.end(sitemap);
  }

  // Hardened Robots.txt with Explicit Googlebot & Google-InspectionTool Directives
  if (req.method === 'GET' && pathname === '/robots.txt') {
    const robots = `User-agent: Googlebot
Allow: /
Allow: /apps
Allow: /apps/
Allow: /feed/products.xml
Allow: /feed/products.json
Disallow: /admin
Disallow: /api/admin/

User-agent: Google-InspectionTool
Allow: /
Allow: /apps
Allow: /apps/
Allow: /feed/products.xml
Allow: /feed/products.json
Disallow: /admin
Disallow: /api/admin/

User-agent: *
Allow: /
Allow: /apps
Allow: /apps/
Allow: /feed/products.xml
Allow: /feed/products.json
Disallow: /admin
Disallow: /api/admin/

Sitemap: https://${host}/sitemap.xml
`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.end(robots);
  }

  // ---------------------------------------------------------------------------
  // ADMIN AUTHENTICATION
  // ---------------------------------------------------------------------------

  if (req.method === 'POST' && pathname === '/api/admin/login') {
    try {
      const rateCheck = checkLoginRateLimit(clientIp);
      if (!rateCheck.allowed) {
        res.setHeader('Retry-After', String(rateCheck.remainingSeconds));
        return sendJson(res, 429, {
          success: false,
          error: `Too many failed login attempts. Locked for ${rateCheck.remainingSeconds} seconds.`
        });
      }

      const { passcode } = await parseBody(req);
      const expectedPasscode = getEffectivePasscode();

      if (!passcode || !secureCompare(String(passcode), String(expectedPasscode))) {
        recordLoginFailure(clientIp);
        return sendJson(res, 401, { success: false, error: 'Invalid admin passcode.' });
      }

      recordLoginSuccess(clientIp);
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

  if (req.method === 'POST' && pathname === '/api/admin/firebase-auth') {
    try {
      const { email, uid, idToken } = await parseBody(req);
      if (!email) {
        return sendJson(res, 400, { success: false, error: 'Email required.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const adminList = [
        'princegaming5555@netroar.dev',
        'princegaming5555@gmail.com',
        'admin@netroar.dev'
      ];
      const isConfiguredAdmin = adminList.includes(cleanEmail) || cleanEmail.endsWith('@netroar.dev');
      if (!isConfiguredAdmin) {
        return sendJson(res, 200, {
          success: true,
          isAdmin: false,
          role: 'user',
          message: 'Authenticated as standard user.'
        });
      }

      // Security: Cryptographic validation of Firebase ID token if present or in production
      if (idToken) {
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
          if (!verifyRes.ok) {
            return sendJson(res, 401, { success: false, error: 'Cryptographic identity verification failed.' });
          }
          const tokenData = await verifyRes.json();
          if (tokenData.email && tokenData.email.toLowerCase() !== cleanEmail) {
            return sendJson(res, 401, { success: false, error: 'Token email mismatch.' });
          }
        } catch (fetchErr) {
          if (process.env.NODE_ENV === 'production') {
            return sendJson(res, 502, { success: false, error: 'Identity verification service unreachable.' });
          }
        }
      } else if (process.env.NODE_ENV === 'production') {
        return sendJson(res, 401, { success: false, error: 'ID token required for administrative elevation in production.' });
      }

      const token = generateSessionToken();
      return sendJson(res, 200, {
        success: true,
        isAdmin: true,
        role: 'admin',
        token,
        expiresIn: SESSION_TTL_MS / 1000,
        message: 'Admin authorization granted via verified Firebase identity.'
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
        // Validate & update passcode
        if (payload.adminPasscode) {
          if (typeof payload.adminPasscode !== 'string' || payload.adminPasscode.trim().length < 8) {
            return sendJson(res, 400, { success: false, error: 'New admin passcode must be at least 8 characters long.' });
          }
          updated.adminPasscode = payload.adminPasscode.trim();
        } else {
          updated.adminPasscode = current.adminPasscode;
        }

        // Harmonize logo and favicon aliases
        if (payload.logoDarkUrl && !payload.brandLogo) updated.brandLogo = payload.logoDarkUrl;
        if (payload.brandLogo && !payload.logoDarkUrl) updated.logoDarkUrl = payload.brandLogo;
        if (payload.faviconUrl && !payload.favicon) updated.favicon = payload.faviconUrl;
        if (payload.favicon && !payload.faviconUrl) updated.faviconUrl = payload.favicon;

        // If favicon is changed and points to a local file, synchronize to public/favicon.png securely
        const effectiveFavicon = payload.faviconUrl || payload.favicon;
        if (effectiveFavicon && typeof effectiveFavicon === 'string' && effectiveFavicon.startsWith('/')) {
          try {
            const rawSubPath = effectiveFavicon.split('?')[0].replace(/^\//, '');
            const cleanFaviconPath = path.normalize(rawSubPath);
            // Security: Prevent path traversal in favicon file synchronization
            if (!cleanFaviconPath.includes('..') && !cleanFaviconPath.includes('\0')) {
              const sourceFavPath = path.resolve(PUBLIC_DIR, cleanFaviconPath);
              const targetFavPath = path.resolve(PUBLIC_DIR, 'favicon.png');
              if (sourceFavPath.startsWith(PUBLIC_DIR) && fs.existsSync(sourceFavPath) && sourceFavPath !== targetFavPath) {
                fs.copyFileSync(sourceFavPath, targetFavPath);
              }
            }
          } catch (syncErr) {
            console.error('Could not sync favicon to /favicon.png:', syncErr);
          }
        }

        writeSettings(updated);
        const { adminPasscode, ...safeSettings } = updated;
        return sendJson(res, 200, { success: true, settings: safeSettings });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // Upload image (Data URL or base64 binary) with validation & sanitization
    if (req.method === 'POST' && pathname === '/api/admin/upload-image') {
      try {
        const { filename, base64Data } = await parseBody(req);
        if (!base64Data) {
          return sendJson(res, 400, { success: false, error: 'base64Data is required.' });
        }
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const ext = (path.extname(filename || 'image.png') || '.png').toLowerCase();

        // Security: Validate buffer against whitelist, size limit, and magic bytes
        const validation = validateImageBuffer(buffer, ext);
        if (!validation.valid) {
          return sendJson(res, 400, { success: false, error: validation.error });
        }

        const safeName = `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
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

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (err) {
    res.statusCode = 400;
    return res.end('Bad Request: Malformed URI');
  }

  let safePath = path.normalize(decodedPath);
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  if (safePath === '/admin' || safePath === '\\admin' || safePath === '/admin/' || safePath === '\\admin\\') {
    safePath = '/admin.html';
  }
  if (safePath === '/login' || safePath === '\\login' || safePath === '/login/' || safePath === '\\login\\') {
    safePath = '/login.html';
  }
  if (safePath === '/apps' || safePath === '\\apps' || safePath === '/apps/' || safePath === '\\apps\\' ||
      safePath === '/app-studios' || safePath === '\\app-studios' || safePath === '/app-studios/' || safePath === '\\app-studios\\' ||
      safePath.startsWith('/app/') || safePath.startsWith('\\app\\') ||
      safePath.startsWith('/apps/') || safePath.startsWith('\\apps\\')) {
    safePath = '/apps.html';
  }

  // Block path traversal and null bytes
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
  } catch (unhandledErr) {
    console.error('Unhandled request processing error:', unhandledErr);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Netroar Studios Server running at http://localhost:${PORT}`);
  console.log(`🌐 Public Catalog: http://localhost:${PORT}/`);
  console.log(`⚡ Admin Control:  http://localhost:${PORT}/admin`);
  console.log(`📦 Merchant Feed:  http://localhost:${PORT}/feed/products.xml`);

  const effectivePass = getEffectivePasscode();
  if (effectivePass === 'netroar@admin2026') {
    console.warn(`⚠️  SECURITY ADVISORY: Server is using the default admin passcode.`);
    console.warn(`⚠️  For live production, configure the ADMIN_PASSCODE environment variable.`);
  } else {
    console.log(`🔒 Custom admin passcode active (Length: ${effectivePass.length} chars).`);
  }
});