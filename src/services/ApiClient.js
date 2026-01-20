import AppConfig from "../config/appConfig.js";

export default class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async executeRestCall(url, method, body = null, headers = {}, timeout = AppConfig.API_TIMEOUT) {
    const finalUrl = this.buildUrl(url);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(finalUrl, options);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`[${method} ${finalUrl}] Request timed out after ${timeout}ms`);
      }
      throw new Error(`[${method} ${finalUrl}] Error: ${err.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = `[${method} ${finalUrl}] ${response.status} ${response.statusText} - ${errorBody}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const text = await response.text();

    // Ignore empty response body
    if (!text || text.trim() === '') {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  buildUrl(url) {
    if (!this.baseUrl) return url.startsWith('/') ? url : `/${url}`;
    return this.baseUrl.endsWith('/') || url.startsWith('/')
      ? `${this.baseUrl}${url}`
      : `${this.baseUrl}/${url}`;
  }
}
