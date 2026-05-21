/**
 * tracker.js — HealthWise Daily Visitor Intelligence
 * Collects: IP, ISP, City, Region, Country, Browser, Device,
 *           Time-on-page, Bot/Human Detection, Demographics
 * Stores data in localStorage and sends to analytics dashboard
 */

(function () {
  "use strict";

  const ZONE_ID = document.querySelector("script[src*='galaksion']")
    ? new URL(document.querySelector("script[src*='galaksion']").src).searchParams.get("zone") || "ZONE_ID_HERE"
    : "ZONE_ID_HERE";

  const SESSION_KEY = "hw_session_" + ZONE_ID;
  const LOG_KEY = "hw_visit_log";
  const pageStart = Date.now();

  /* ─── 1. BOT DETECTION ─────────────────────────────────── */
  function detectBot() {
    const ua = navigator.userAgent.toLowerCase();
    const botPatterns = [
      "bot", "crawl", "spider", "slurp", "wget", "curl",
      "fetch", "python", "node", "phantom", "headless", "selenium",
      "puppeteer", "playwright", "lighthouse", "prerender", "googlebot",
      "bingbot", "yandexbot", "facebookexternalhit", "twitterbot",
      "linkedinbot", "applebot", "duckduckbot", "baiduspider"
    ];
    const isUABot = botPatterns.some(p => ua.includes(p));

    // Behavioural signals
    const noPlugins = navigator.plugins.length === 0;
    const noWebGL = (() => {
      try {
        const gl = document.createElement("canvas").getContext("webgl");
        return !gl;
      } catch { return true; }
    })();
    const noLanguages = !navigator.languages || navigator.languages.length === 0;
    const noTouch = !("ontouchstart" in window) && navigator.maxTouchPoints === 0; // Desktop = fine
    const webdriver = navigator.webdriver === true;
    const chromeHeadless = /HeadlessChrome/.test(navigator.userAgent);

    const suspiciousScore =
      (isUABot ? 10 : 0) +
      (webdriver ? 8 : 0) +
      (chromeHeadless ? 8 : 0) +
      (noPlugins ? 2 : 0) +
      (noWebGL ? 2 : 0) +
      (noLanguages ? 3 : 0);

    return {
      isBot: suspiciousScore >= 8,
      score: suspiciousScore,
      signals: { isUABot, webdriver, chromeHeadless, noPlugins, noWebGL, noLanguages }
    };
  }

  /* ─── 2. BROWSER & DEVICE ─────────────────────────────── */
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown", version = "";

    if (/Edg\//.test(ua))       { browser = "Edge";    version = ua.match(/Edg\/([\d.]+)/)?.[1] || ""; }
    else if (/OPR\//.test(ua))  { browser = "Opera";   version = ua.match(/OPR\/([\d.]+)/)?.[1] || ""; }
    else if (/Chrome\//.test(ua)){ browser = "Chrome"; version = ua.match(/Chrome\/([\d.]+)/)?.[1] || ""; }
    else if (/Firefox\//.test(ua)){ browser = "Firefox"; version = ua.match(/Firefox\/([\d.]+)/)?.[1] || ""; }
    else if (/Safari\//.test(ua)) { browser = "Safari"; version = ua.match(/Version\/([\d.]+)/)?.[1] || ""; }

    const isDesktop = !/Mobi|Android|iPhone|iPad/.test(ua);
    const os = /Windows/.test(ua) ? "Windows" :
               /Mac OS X/.test(ua) ? "macOS" :
               /Linux/.test(ua) ? "Linux" :
               /Android/.test(ua) ? "Android" :
               /iPhone|iPad/.test(ua) ? "iOS" : "Unknown";

    return {
      browser, version, os,
      device: isDesktop ? "Desktop" : "Mobile/Tablet",
      screenW: window.screen.width,
      screenH: window.screen.height,
      language: navigator.language || "unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      cookieEnabled: navigator.cookieEnabled
    };
  }

  /* ─── 3. GEO + IP + ISP via ipapi.co (free, no key needed) */
  async function getGeoData() {
    try {
      const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!r.ok) throw new Error("geo fail");
      const d = await r.json();
      return {
        ip:          d.ip        || "N/A",
        city:        d.city      || "N/A",
        region:      d.region    || "N/A",
        country:     d.country_name || "N/A",
        countryCode: d.country   || "N/A",
        postal:      d.postal    || "N/A",
        lat:         d.latitude  || 0,
        lon:         d.longitude || 0,
        isp:         d.org       || "N/A",
        asn:         d.asn       || "N/A",
        timezone:    d.timezone  || "N/A"
      };
    } catch {
      return { ip:"N/A", city:"N/A", region:"N/A", country:"N/A",
               countryCode:"N/A", postal:"N/A", lat:0, lon:0,
               isp:"N/A", asn:"N/A", timezone:"N/A" };
    }
  }

  /* ─── 4. ENGAGEMENT / TIME TRACKING ───────────────────── */
  let activeTime = 0, lastActive = Date.now(), isActive = true;
  const IDLE_TIMEOUT = 30000; // 30s idle threshold
  let idleTimer;

  function resetIdle() {
    if (!isActive) { isActive = true; lastActive = Date.now(); }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { isActive = false; }, IDLE_TIMEOUT);
  }

  ["mousemove","keydown","scroll","click","touchstart"].forEach(evt =>
    document.addEventListener(evt, resetIdle, { passive: true })
  );
  resetIdle();

  setInterval(() => {
    if (isActive) activeTime += 1;
  }, 1000);

  function getTimeStats() {
    const totalSec = Math.round((Date.now() - pageStart) / 1000);
    return {
      totalSeconds:  totalSec,
      activeSeconds: activeTime,
      idleSeconds:   totalSec - activeTime,
      engagementPct: totalSec > 0 ? Math.round((activeTime / totalSec) * 100) : 0
    };
  }

  /* ─── 5. CLICK TRACKING ────────────────────────────────── */
  let clickCount = 0, linkClicks = [];
  document.addEventListener("click", e => {
    clickCount++;
    const el = e.target.closest("a");
    if (el) {
      linkClicks.push({
        text:    el.innerText.slice(0, 60),
        href:    el.href,
        time:    Math.round((Date.now() - pageStart) / 1000) + "s"
      });
    }
  });

  /* ─── 6. DEMOGRAPHICS INFERENCE ───────────────────────── */
  function inferDemographics(geoData) {
    // Inferred from context signals — not a deterministic age detector
    const tz = geoData.timezone || "";
    const isUSA = geoData.countryCode === "US";
    const isDesktop = getBrowserInfo().device === "Desktop";

    return {
      targetMatch:   isUSA && isDesktop,
      likelyDesktop: isDesktop,
      country:       geoData.country,
      targetAgeNote: "Demographic 40+ inferred from: desktop device + health content niche + USA geo. No PII age collected.",
      nicheRelevance: isUSA ? "High — US health/finance niche" : "Low — non-US traffic"
    };
  }

  /* ─── 7. ASSEMBLE & SAVE VISIT RECORD ──────────────────── */
  async function buildRecord() {
    const bot     = detectBot();
    const browser = getBrowserInfo();
    const geo     = await getGeoData();
    const demo    = inferDemographics(geo);

    const record = {
      zoneId:      ZONE_ID,
      sessionId:   getSessionId(),
      timestamp:   new Date().toISOString(),
      page:        location.href,
      referrer:    document.referrer || "direct",
      bot,
      browser,
      geo,
      demographics: demo,
      time:        getTimeStats(),
      clicks:      { total: clickCount, links: linkClicks }
    };

    saveToLog(record);
    broadcastToUI(record);
    return record;
  }

  function getSessionId() {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) { s = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2,8); sessionStorage.setItem(SESSION_KEY, s); }
    return s;
  }

  function saveToLog(record) {
    try {
      const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      logs.unshift(record);
      if (logs.length > 200) logs.length = 200; // cap at 200 records
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) { console.warn("Tracker storage error:", e); }
  }

  function broadcastToUI(record) {
    window.__hw_latest = record;
    document.dispatchEvent(new CustomEvent("hw_visit", { detail: record }));
  }

  /* ─── 8. SEND ON UNLOAD ─────────────────────────────────── */
  async function sendFinalRecord() {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    if (!logs.length) return;
    const latest = logs[0];
    latest.time = getTimeStats();
    latest.clicks.total = clickCount;
    latest.clicks.links = linkClicks;
    logs[0] = latest;
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }

  window.addEventListener("visibilitychange", () => {
    if (document.hidden) sendFinalRecord();
  });
  window.addEventListener("beforeunload", sendFinalRecord);

  /* ─── 9. INIT ─────────────────────────────────────────── */
  window.addEventListener("load", () => {
    buildRecord().then(r => {
      console.log("[HealthWise Tracker] Visit recorded:", {
        zoneId:   r.zoneId,
        isBot:    r.bot.isBot,
        ip:       r.geo.ip,
        country:  r.geo.country,
        browser:  r.browser.browser,
        device:   r.browser.device,
        isp:      r.geo.isp
      });
    });
  });

  // Expose for dashboard
  window.HWTracker = {
    getLogs:       () => JSON.parse(localStorage.getItem(LOG_KEY) || "[]"),
    clearLogs:     () => localStorage.removeItem(LOG_KEY),
    getTimeStats,
    detectBot,
    getBrowserInfo,
    getGeoData
  };

})();
