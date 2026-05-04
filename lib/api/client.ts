/* Dynamically determine API base URL. */
const DEFAULT_API_BASE_URL = "https://dukaapp-dyol.onrender.com";

const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
})();

export function getApiBaseUrl() {
  return API_BASE_URL;
}

type RequestOptions = RequestInit & { token?: string | null };

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token: optToken, headers, ...rest } = options;
  const token = optToken ?? (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);
  const url = new URL(path, API_BASE_URL).toString();

  if (process.env.NEXT_PUBLIC_API_DEBUG === "true") {
    // eslint-disable-next-line no-console
    console.log(`[apiFetch] Requesting: ${url}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
  } catch (error) {
    console.error(`[apiFetch] Network error for ${url}:`, error);
    throw new Error(`Network error trying to reach API at ${url}: ${(error as Error).message}`);
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    // Don't log 401 as an error for /auth/me or /auth/login to reduce console noise
    if (!(response.status === 401 && (path === "/auth/me" || path === "/auth/login"))) {
      console.error(`[apiFetch] Error status: ${response.status} for ${path}`);
    }
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // ignore json parse failures
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    console.warn(`[apiFetch] Empty response for ${path}`);
    return [] as unknown as T; // Return empty array as fallback for list requests
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error(`[apiFetch] JSON parse error for ${path}:`, e);
    console.error(`[apiFetch] Response text:`, text);
    throw new Error(`Invalid JSON response from ${path}`);
  }
}
