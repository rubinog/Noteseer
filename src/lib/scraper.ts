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
 * Attempts to extract a YouTube video transcript using YouTube internal
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

    const captionMatch = html.match(/"captionTracks":(\[.*?\])/s);
    if (!captionMatch) {
      console.warn('[YouTube] No captionTracks found in page HTML for', videoId);
      return null;
    }

    let captionTracks: Array<{ baseUrl: string; languageCode: string; kind?: string }> = [];
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch {
      return null;
    }

    if (captionTracks.length === 0) return null;

    // Prefer: Italian > original language > auto-generated (asr)
    const preferred =
      captionTracks.find((t) => t.languageCode === 'it') ||
      captionTracks.find((t) => t.kind !== 'asr') ||
      captionTracks[0];

    const transcriptUrl = preferred.baseUrl;
    if (!transcriptUrl) return null;

    const res = await fetch(transcriptUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const xmlText = await res.text();

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
  } catch (err) {
    console.warn('[YouTube] Transcript extraction failed:', err);
    return null;
  }
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
