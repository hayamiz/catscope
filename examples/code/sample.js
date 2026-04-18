/**
 * Lightweight HTTP client with retry logic and timeout support.
 */

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;

class FetchError extends Error {
  constructor(message, statusCode, retries) {
    super(message);
    this.name = "FetchError";
    this.statusCode = statusCode;
    this.retries = retries;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          attempt
        );
      }

      return await response.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }
}

export { fetchWithRetry, FetchError, DEFAULT_TIMEOUT_MS };
