/**
 * Automated Verification Suite for Netroar Studios
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const TEST_PORT = 3845;
let serverProcess = null;

function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: urlPath,
      method: method,
      headers: { ...headers }
    };

    if (body) {
      const dataStr = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(dataStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Netroar Studios — Full Stack Integration Test Suite');
  console.log('================================================================');

  // 1. Spawn server
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', d => {
    // console.log('[SERVER]', d.toString().trim());
  });
  serverProcess.stderr.on('data', d => {
    console.error('[SERVER ERR]', d.toString().trim());
  });

  // Wait for server ready
  await new Promise(r => setTimeout(r, 1200));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.json?.status === 'ok', '1.1 GET /api/health responds with 200 OK');

    // Test 2: Public static HTML
    const index = await request('GET', '/');
    assert(index.status === 200 && index.data.includes('Netroar Studios'), '2.1 GET / serves Rockstar style index.html');

    const appStudios = await request('GET', '/apps');
    assert(appStudios.status === 200 && appStudios.data.includes('APP STUDIOS SPOTLIGHT'), '2.2 GET /apps serves App Studios showcase');

    const admin = await request('GET', '/admin');
    assert(admin.status === 200 && admin.data.includes('Admin Control Panel'), '2.3 GET /admin serves admin.html');

    const css = await request('GET', '/style.css');
    assert(css.status === 200 && css.data.includes('--accent-rockstar'), '2.4 GET /style.css serves Rockstar palette');

    // Test 3: Public Apps API
    const appsRes = await request('GET', '/api/apps');
    assert(appsRes.status === 200 && appsRes.json?.success && Array.isArray(appsRes.json?.apps) && appsRes.json?.apps.length >= 1, 
      `3.1 GET /api/apps returns flagship application (Count: ${appsRes.json?.apps?.length})`);

    const hasTaskflow = appsRes.json?.apps?.some(a => a.name.includes('TaskFlow'));
    assert(hasTaskflow, '3.2 Seed apps include Netroar TaskFlow');

    // Test 4: Public Settings API (No password leak)
    const settingsRes = await request('GET', '/api/settings');
    assert(settingsRes.status === 200 && settingsRes.json?.settings?.adminPasscode === undefined, 
      '4.1 GET /api/settings does not leak adminPasscode');

    // Test 5: Google Merchant XML & JSON Feeds
    const xmlFeed = await request('GET', '/feed/products.xml');
    assert(xmlFeed.status === 200 && xmlFeed.data.includes('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">'), 
      '5.1 GET /feed/products.xml returns valid Google Merchant RSS 2.0 XML');

    const jsonFeed = await request('GET', '/feed/products.json');
    assert(jsonFeed.status === 200 && jsonFeed.json?.itemsCount >= 1, 
      '5.2 GET /feed/products.json returns structured products JSON');

    // Test 6: SEO
    const sitemap = await request('GET', '/sitemap.xml');
    assert(sitemap.status === 200 && sitemap.data.includes('<urlset'), '6.1 GET /sitemap.xml returns XML sitemap');

    // Test 7: Admin Authentication
    const badLogin = await request('POST', '/api/admin/login', {}, { passcode: 'wrongpassword' });
    assert(badLogin.status === 401 && badLogin.json?.success === false, '7.1 POST /api/admin/login rejects invalid passcode');

    const goodLogin = await request('POST', '/api/admin/login', {}, { passcode: 'netroar@admin2026' });
    assert(goodLogin.status === 200 && goodLogin.json?.token, '7.2 POST /api/admin/login grants session token with correct passcode');
    const token = goodLogin.json?.token;

    // Test 8: Admin App CRUD
    const createRes = await request('POST', '/api/admin/apps', { 'Authorization': `Bearer ${token}` }, {
      name: 'Netroar Test Suite App',
      tagline: 'Verification runner app',
      description: 'Temporary app for integration test verification',
      category: 'Utilities',
      platforms: ['Web', 'Windows'],
      status: 'Beta',
      isFeatured: false,
      version: '1.0.0'
    });
    assert(createRes.status === 201 && createRes.json?.app?.id, '8.1 POST /api/admin/apps creates new app');
    const testAppId = createRes.json?.app?.id;

    const updateRes = await request('PUT', `/api/admin/apps/${testAppId}`, { 'Authorization': `Bearer ${token}` }, {
      tagline: 'Updated verification tagline'
    });
    assert(updateRes.status === 200 && updateRes.json?.app?.tagline === 'Updated verification tagline', '8.2 PUT /api/admin/apps/:id updates app');

    const deleteRes = await request('DELETE', `/api/admin/apps/${testAppId}`, { 'Authorization': `Bearer ${token}` });
    assert(deleteRes.status === 200 && deleteRes.json?.success, '8.3 DELETE /api/admin/apps/:id removes app');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log('================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
