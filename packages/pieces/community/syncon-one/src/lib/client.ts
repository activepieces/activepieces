import { httpClient, HttpMethod } from "@activepieces/pieces-common";

/** `SYNCON_API_BASE` exists for the tests. */
export const baseUrl = () =>
  (process.env.SYNCON_API_BASE || "https://synconone.com/api/v1").replace(/\/$/, "");

/** What an AppConnection holds for a secret-text auth, or the bare string the sign-in check gets. */
export const keyOf = (auth: unknown): string =>
  typeof auth === "string" ? auth : String((auth as { secret_text?: string })?.secret_text ?? "");

type Query = Record<string, string | number | boolean | undefined | null>;

export type ApiCall = {
  method?: HttpMethod;
  path: string;
  query?: Query;
  body?: unknown;
};

/** The status of a plain GET, for the sign-in check. A network failure is not a refused key. */
export async function rawGet(auth: string, url: string): Promise<number> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: { Authorization: `Bearer ${auth}`, Accept: "application/json" },
    });
    return response.status;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return typeof status === "number" ? status : 0;
  }
}

/** A refusal from the API, with its own words and code so a flow shows what to fix. */
export class SynconError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "SynconError";
  }
}

/** One call to the API. Returns the parsed body (`{ data, pagination? }`). */
export async function api<T = { data: unknown }>(auth: unknown, call: ApiCall): Promise<T> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(call.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") query[key] = String(value);
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method: call.method ?? HttpMethod.GET,
      url: `${baseUrl()}${call.path}`,
      queryParams: query,
      body: call.body,
      headers: {
        Authorization: `Bearer ${keyOf(auth)}`,
        Accept: "application/json",
        ...(call.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });
    return response.body;
  } catch (error) {
    const response = (error as { response?: { status?: number; body?: unknown } })?.response;
    const detail = (
      response?.body as { error?: { message?: string; code?: string; requestId?: string } }
    )?.error;
    if (response && typeof response.status === "number") {
      const message = detail?.message
        ? `${detail.message}${detail.requestId ? ` (request ${detail.requestId})` : ""}`
        : `Syncon One answered ${response.status}.`;
      throw new SynconError(message, response.status, detail?.code ?? "error");
    }
    throw error;
  }
}

export const isMissing = (error: unknown) => error instanceof SynconError && error.status === 404;
