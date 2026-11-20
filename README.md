# Netroar Studios — Official Software Ecosystem & Hub

Welcome to **Netroar Studios** (`Netroar-Studios`), the official web portal and software catalog for all apps, websites, tools, icons, and digital assets published by Prince Singh / Netroar Studios.

Designed with the signature **Pro Cyber-Acrylic** design system matching **Netroar TaskFlow** (`#05080c` void dark theme, `#00f5b8` neon mint accents, glowing orbs, and glassmorphism).

---

## 🌟 Key Features

1. **Official Software & Product Catalog:**
   - Pre-populated with official Netroar software:
     - **Netroar TaskFlow** (Web, Windows, Android gamified task manager)
     - **Netroar Axon Assistant** (AI neural voice assistant for Android & Windows)
     - **Netroar Bridge** (High-speed clipboard, notification & file sync across PC & Phone)
     - **Netroar Store** (Developer assets, sprite sheets, and Flutter widgets)
     - **Void Otaku** (Cyber-themed media catalog & anime community hub)
     - **Netroar IPR Portal** (Official cryptographic verification & rights registry)
   - Real-time search across names, tags, platforms, and features.
   - Filtering by Platform (`Web`, `Windows`, `Android`) and Category (`Productivity`, `AI & Smart Tools`, `Utilities`, `Digital Assets`, etc.).
   - In-depth modal drawer with full descriptions, features checklist, and direct links.

2. **Full-Control Admin Suite (`/admin`):**
   - Protected by master passcode (Default: `netroar@admin2026`, easily changeable in settings).
   - **App Manager:**
     - Add new software with names, slugs, taglines, categories, supported platforms, release status, download links, website links, repository links, and feature bullets.
     - Upload custom app icons directly from your browser.
     - Edit or permanently delete apps with confirmation safeguards.
     - Toggle "Featured on Front Page" flag.
   - **Studio Settings:**
     - Edit studio name, tagline, hero title & bio, founder name, support email, and social media handles.
     - Update admin master passcode securely.
   - **Data Backup & Recovery:**
     - Export full database backup to `.json`.
     - Import `.json` backup files directly to restore catalog.

3. **Google Merchant Center & AI Scanner Sync:**
   - **XML Product Feed:** `/feed/products.xml` (RSS 2.0 with Google Base schema `xmlns:g="http://base.google.com/ns/1.0"`).
   - **JSON Product Feed:** `/feed/products.json`
   - **Schema.org Structured Data:** Embedded JSON-LD `SoftwareApplication`, `ItemList`, and `Organization` on `index.html` for instant Googlebot indexing.
   - **Sitemap & Robots:** `/sitemap.xml` and `/robots.txt`.

---

## 🚀 Quick Start (Local Development)

The server runs on native Node.js (v18+) with **zero external dependencies required**:

```bash
# 1. Navigate to the project directory
cd "D:\NETROAR-STUDIOS\WORKSPACE\Netroar WorkSpace\Projects\Programming\Web-Devlopment\Netroar-Studios"

# 2. Start the server
npm start
# or: node server.js
```

Then open your browser:
- **Public Catalog:** [http://localhost:3000](http://localhost:3000)
- **Admin Control Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Google Merchant XML Feed:** [http://localhost:3000/feed/products.xml](http://localhost:3000/feed/products.xml)

---

## 🔒 Admin Credentials & Security

- **Default Master Passcode (Local Dev):** `netroar@admin2026`
- **Production Passcode Configuration:** Set the `ADMIN_PASSCODE` environment variable in your production hosting dashboard (e.g. Render / Railway / Docker).
- **Brute Force Protection:** Automatic IP-based rate limiting (5 consecutive failed attempts trigger an automatic 15-minute lockout).
- Once logged in, you can also update the stored passcode under the **Studio Settings** tab (minimum 8 characters).

---

## 🌐 Deploying to Render / Cloud Hosts

- **Runtime:** Node.js
- **Build Command:** `npm install` (or leave empty)
- **Start Command:** `node server.js`
- **Environment Variables:**
  - `PORT`: Automatically set by Render
  - `STORAGE_DIR`: `/var/data` (optional, if using a Render persistent disk)
