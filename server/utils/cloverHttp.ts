import axios, { AxiosError, type AxiosRequestConfig, type Method } from "axios";

/**
 * Thin wrapper around axios for Clover API calls.
 *
 * Responsibilities:
 *   - Attach the Bearer access token and JSON headers.
 *   - Normalise Clover's error responses into a single Error with a readable
 *     message + the HTTP status + the raw Clover body (for logging/debugging).
 *
 * Base URL is passed in by the caller because Clover splits its APIs across
 * multiple hosts (platform vs ecommerce vs oauth) — see cloverConfig.ts.
 */

export class CloverApiError extends Error {
  readonly status?: number;
  readonly responseBody?: unknown;

  constructor(message: string, status?: number, responseBody?: unknown) {
    super(message);
    this.name = "CloverApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export interface CloverRequestOptions {
  baseUrl: string;
  path: string;
  /** Bearer token. Optional: the tokenizer authenticates via the apikey header instead. */
  accessToken?: string;
  method?: Method;
  data?: unknown;
  /** Extra headers (e.g. apikey for the tokenizer, User-Agent for the pay endpoint). */
  headers?: Record<string, string>;
}

export async function cloverRequest<T = unknown>(
  options: CloverRequestOptions
): Promise<T> {
  const { baseUrl, path, accessToken, method = "GET", data, headers } = options;

  const config: AxiosRequestConfig = {
    baseURL: baseUrl,
    url: path,
    method,
    data,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      "Content-Type": "application/json",
      ...headers,
    },
  };

  try {
    const response = await axios.request<T>(config);
    return response.data;
  } catch (err) {
    throw toCloverApiError(err, method, path);
  }
}

function toCloverApiError(
  err: unknown,
  method: Method,
  path: string
): CloverApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status;
    const body = axiosErr.response?.data;
    const detail =
      (typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: unknown }).message)
        : undefined) ?? axiosErr.message;

    return new CloverApiError(
      `Clover ${method} ${path} failed${status ? ` (${status})` : ""}: ${detail}`,
      status,
      body
    );
  }

  return new CloverApiError(
    `Clover ${method} ${path} failed: ${String(err)}`
  );
}
