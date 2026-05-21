# HealthWise Daily — Pop-Under Ad Site
## Galaksion Publisher Setup Guide

---

## 📁 File Structure

```
popunder-site/
├── index.html        ← Main landing page (health/wellness niche, 40+ USA)
├── dashboard.html    ← Analytics dashboard (visitor data, bot detection, zone stats)
├── css/
│   └── style.css     ← Site styles
├── js/
│   ├── tracker.js    ← Visitor intelligence (IP, ISP, geo, bot detect, time-on-page)
│   └── main.js       ← Page interactions
└── README.md
```

---

## 🔑 Step 1: Get Your Galaksion Zone ID

1. Log in at **https://galaksion.com/publisher**
2. Go to **Sites & Zones → Add Site**
3. Enter your domain URL and select **Pop-Under** as the ad format
4. Submit for approval (usually takes a few hours)
5. Once approved, click your zone — you'll see:
   - **Zone ID** displayed at the top of the zone details page
   - Also embedded in the script tag: `?zone=YOUR_ZONE_ID`
6. You can also find all zone IDs at: **Publisher → Statistics** — each row shows the Zone ID column

---

## ✏️ Step 2: Add Your Zone ID to the Site

Open `index.html` and find line ~20:

```javascript
var ZONE_ID = "ZONE_ID_HERE";  ← Replace this
```

Change it to your actual Zone ID, for example:

```javascript
var ZONE_ID = "123456";
```

Save the file.

---

## 🚀 Step 3: Upload to GitHub Pages (Free Hosting)

1. Go to **https://github.com** → create a free account
2. Click the **+** button → **New Repository**
3. Name it (e.g. `healthwise-site`), set to **Public**, click **Create repository**
4. On the new repo page, click **uploading an existing file**
5. Drag and drop your entire `popunder-site/` folder contents
6. Click **Commit changes**
7. Go to **Settings → Pages** (left sidebar)
8. Under **Source**: select **Deploy from a branch → main → / (root)** → Save
9. Your site will be live within 2 minutes at:
   `https://YOUR_USERNAME.github.io/healthwise-site/`

---

## 📊 Step 4: View Analytics

Open `dashboard.html` in your browser to see:
- Zone ID and status
- All visitor sessions
- IP address, city, region, country
- ISP / ASN / carrier
- Browser, OS, device type
- Time on page (active vs idle)
- Bot detection score and signals
- USA traffic percentage
- Demographic niche match indicator

Links directly to all Galaksion dashboard pages are also included.

---

## 🤖 Bot vs Human Detection

The tracker scores each visitor 0–10:

| Score | Status | Meaning |
|-------|--------|---------|
| 0–3 | ✅ Human | Normal browser, all signals pass |
| 4–7 | ⚠️ Suspicious | Some anomalies, investigate |
| 8–10 | 🤖 Bot | Strong bot indicators, flag visit |

**Signals checked:**
- User-agent bot patterns (Googlebot, etc.)
- `navigator.webdriver` flag (Selenium/Playwright)
- Headless Chrome detection
- Missing browser plugins
- No WebGL support
- No `navigator.languages`

---

## 🎯 Best Niches for USA Desktop 40+ Traffic

Ranked by expected CPM on Galaksion pop-under:

| Niche | Expected CPM |
|-------|-------------|
| Medicare / Health Insurance | $5–12 |
| Retirement / Social Security | $4–10 |
| Home Services (solar, walk-in tubs) | $4–9 |
| Health Supplements / Vitamins | $3–8 |
| Online Surveys / Sweepstakes | $2–5 |

This site is pre-configured for the **Health & Wellness** niche which is ideal for 40+ USA desktop users.

---

## 📍 Where to Check Key Data in Galaksion

| Data | Location in Galaksion Dashboard |
|------|--------------------------------|
| Zone ID | Publisher → Sites & Zones → Click your zone |
| Impressions | Publisher → Statistics → Zone column |
| CPM & Revenue | Publisher → Statistics → Revenue column |
| Balance | Publisher → Payments |
| Traffic by Country | Publisher → Statistics → filter by Country |
| Bot filtering | Galaksion filters bots automatically on their end |

---

## ⚠️ Notes

- The tracker uses **ipapi.co** (free tier, 1000 requests/day). For production at scale, upgrade to a paid geo API.
- All visitor data is stored in the browser's `localStorage` — no server needed.
- The `dashboard.html` file should be password-protected or kept local if you don't want it public.
- Always comply with your jurisdiction's cookie/privacy laws (GDPR, CCPA) before collecting visitor data.
