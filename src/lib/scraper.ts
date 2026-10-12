import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ScrapedData {
  title: string;
  description: string;
  url: string;
  favicon_url: string | null;
  image_url: string | null;
  readable_html: string | null;
  content: string | null;
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapedData> {
  let targetUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const parsedUrl = new URL(targetUrl);

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // 1. Extract metadata with Cheerio
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text().trim() ||
    parsedUrl.hostname;

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  let imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    null;

  if (imageUrl) {
    try {
      imageUrl = new URL(imageUrl, targetUrl).href;
    } catch {
      imageUrl = null;
    }
  }

  // Favicon detection
  let faviconUrl =
    $('link[rel="apple-touch-icon"]').attr('href') ||
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    null;

  if (faviconUrl) {
    try {
      faviconUrl = new URL(faviconUrl, targetUrl).href;
    } catch {
      faviconUrl = null;
    }
  } else {
    faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
  }

  // 2. YouTube transcript extraction (takes priority over Readability for YT links)
  const youtubeTranscript = await tryExtractYouTubeTranscript(html, targetUrl);

  // 3. Extract readability content with Readability & JSDOM (for non-YouTube pages)
  let readableHtml: string | null = null;
  let textContent: string | null = null;

  if (!youtubeTranscript) {
    try {
      const dom = new JSDOM(html, { url: targetUrl });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        readableHtml = article.content || null;
        textContent = article.textContent?.replace(/\s+/g, ' ').trim() || null;
      }
    } catch (err) {
      console.warn('Readability extraction failed for:', targetUrl, err);
    }
  }

  return {
    title: title.slice(0, 300),
    description: description.slice(0, 800),
    url: targetUrl,
    favicon_url: faviconUrl,
    image_url: imageUrl,
    readable_html: readableHtml,
    content: youtubeTranscript || textContent || description,
  };
}

/**
 * Attempts to extract a YouTube video transcript using YouTube's internal
 * timedtext API. No API key required.
 * Returns the transcript as plain text, or null if unavailable.
 */
async function tryExtractYouTubeTranscript(
  html: string,
  pageUrl: string
): Promise<string | null> {
  try {
    const videoId = extractYouTubeVideoId(pageUrl);
    if (!videoId) return null;

    // Always fetch the canonical watch page directly.
    // youtu.be redirects may return a lightweight page without captionTracks.
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let pageHtml = html;

    // Re-fetch only if the original URL was not already a watch page
    if (!pageUrl.includes('youtube.com/watch')) {
      try {
        const watchRes = await fetch(watchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
          },
          signal: AbortSignal.timeout(12000),
        });
        if (watchRes.ok) pageHtml = await watchRes.text();
      } catch {
        // continue with original html
      }
    }

    // Extract captionTracks from the ytInitialPlayerResponse blob.
    // YouTube embeds it as: "captionTracks":[{...},{...}]
    // Use a greedy match inside a bounded window to avoid runaway matches.
    const tracksResult = extractCaptionTracks(pageHtml);

    if (tracksResult && tracksResult.length > 0) {
      const transcript = await fetchTranscriptFromTracks(tracksResult, videoId);
      if (transcript) return transcript;
    } else {
      console.warn('[YouTube] No captionTracks found for', videoId, '— trying timedtext fallback');
    }

    // Fallback: try the timedtext API directly with common languages
    return await fetchTimedtextFallback(videoId);
  } catch (err) {
    console.warn('[YouTube] Transcript extraction failed:', err);
    return null;
  }
}

function extractCaptionTracks(
  html: string
): Array<{ baseUrl: string; languageCode: string; kind?: string }> | null {
  // Find "captionTracks" and grab everything up to the matching ]
  const start = html.indexOf('"captionTracks":[');
  if (start === -1) return null;

  const arrayStart = html.indexOf('[', start);
  if (arrayStart === -1) return null;

  // Walk forward to find the matching closing bracket
  let depth = 0;
  let i = arrayStart;
  for (; i < html.length && i < arrayStart + 50000; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }

  const jsonStr = html.slice(arrayStart, i + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function fetchTranscriptFromTracks(
  captionTracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>,
  videoId: string
): Promise<string | null> {
  // Prefer: Italian > non-auto-generated > first available
  const preferred =
    captionTracks.find((t) => t.languageCode === 'it') ||
    captionTracks.find((t) => t.kind !== 'asr') ||
    captionTracks[0];

  const transcriptUrl = preferred?.baseUrl;
  if (!transcriptUrl) return null;

  const res = await fetch(transcriptUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return null;

  const xmlText = await res.text();
  return parseTranscriptXml(xmlText, videoId);
}

async function fetchTimedtextFallback(videoId: string): Promise<string | null> {
  const langs = ['it', 'en', 'en-US'];
  for (const lang of langs) {
    try {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json() as { events?: Array<{ segs?: Array<{ utf8: string }> }> };
      if (!data.events?.length) continue;

      const text = data.events
        .flatMap((e) => e.segs || [])
        .map((s) => s.utf8?.replace(/\n/g, ' ').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text.length > 50) {
        console.log(`[YouTube] Timedtext fallback (${lang}) for ${videoId}: ${text.length} chars`);
        return text.slice(0, 6000);
      }
    } catch {
      continue;
    }
  }
  return null;
}

function parseTranscriptXml(xmlText: string, videoId: string): string | null {
  const textParts: string[] = [];
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xmlText)) !== null) {
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
    if (decoded) textParts.push(decoded);
  }

  if (textParts.length === 0) return null;

  const transcript = textParts.join(' ').replace(/\s+/g, ' ').trim();
  console.log(`[YouTube] Transcript extracted for ${videoId}: ${transcript.length} chars`);
  return transcript.slice(0, 6000);
}

/**
 * Extracts the YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, embed/, etc.
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const shortsMatch = parsed.pathname.match(/^\/(shorts|embed|v)\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[2];
    }

    if (hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}
