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
    // Fallback to Google Favicon resolver or domain favicon
    faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
  }

  // 2. Extract readability content with Readability & JSDOM
  let readableHtml: string | null = null;
  let textContent: string | null = null;

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

  return {
    title: title.slice(0, 300),
    description: description.slice(0, 800),
    url: targetUrl,
    favicon_url: faviconUrl,
    image_url: imageUrl,
    readable_html: readableHtml,
    content: textContent || description,
  };
}
