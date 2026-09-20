const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
): Promise<T> {
  const token = localStorage.getItem("daylog_token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "We could not reach DayLog. Check your connection and try again."
    );
  }

  if (response.status === 401) {
    onUnauthorized?.();

    throw new ApiError(
      "Your session has ended. Please sign in again.",
      401
    );
  }

  if (!response.ok) {
    let detail = "";

    try {
      const body = await response.json();
      detail = body?.message || body?.error || "";
    } catch {
      // Friendly fallback
    }

    const messages: Record<number, string> = {
      400: "That information needs a quick check.",
      404: "We could not find that record.",
      409: "That already exists.",
      500: "DayLog is having a quiet moment. Please try again.",
    };

    throw new ApiError(
      detail ||
        messages[response.status] ||
        "Something went wrong. Please try again.",
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}