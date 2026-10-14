import { isRecord } from "./values";
import type { BirdHttpClient } from "./types";
import { credentialForAuth, sendBirdRequest } from "./request";

const pathError =
  "Enter a relative Bird API path such as /v1/workspace. Put query parameters in Query parameters.";
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
function apiPath(path: unknown): string {
  if (
    typeof path !== "string" ||
    !/^\/v[1-9][0-9]*\//.test(path) ||
    /[\\\s?#]/.test(path)
  )
    throw new Error(pathError);
  for (const segment of path.slice(1).split("/")) {
    let decoded;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      throw new Error(pathError);
    }
    if (
      !decoded ||
      decoded === "." ||
      decoded === ".." ||
      /[\\/%?#\s\x00-\x1f\x7f]/.test(decoded)
    )
      throw new Error(pathError);
  }
  return path;
}
function dictionary(value: unknown, label: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (
    !isRecord(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    throw new Error(`${label} must be an object.`);
  return value;
}
const blockedHeaders = new Set([
  "authorization",
  "host",
  "cookie",
  "set-cookie",
  "content-type",
  "accept",
  "content-length",
  "transfer-encoding",
  "connection",
  "upgrade",
  "te",
  "trailer",
  "expect",
  "forwarded",
  "x-workspace-id",
  "x-realtime-key",
  "x-realtime-secret",
  "x-original-url",
  "x-rewrite-url",
  "x-http-method-override",
  "x-method-override",
]);
function requestHeaders(input: unknown): Record<string, string> {
  const headers: Record<string, string> = Object.create(null);
  for (const [name, value] of Object.entries(dictionary(input, "Headers"))) {
    const key = name.toLowerCase();
    if (
      !/^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(key) ||
      blockedHeaders.has(key) ||
      key.startsWith("proxy-") ||
      key.startsWith("x-forwarded-") ||
      key.startsWith("sec-") ||
      typeof value !== "string" ||
      /[\x00-\x1f\x7f]/.test(value) ||
      Object.hasOwn(headers, key)
    )
      throw new Error(
        "Enter a valid, unique header. Authentication, workspace, routing and JSON headers are managed by this action.",
      );
    headers[key] = value;
  }
  return { ...headers };
}
function queryParameters(value: unknown): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = Object.create(null);
  const scalar = (value: unknown) =>
    ["string", "boolean", "number"].includes(typeof value) &&
    (typeof value !== "number" || Number.isFinite(value));
  for (const [key, item] of Object.entries(
    dictionary(value, "Query parameters"),
  )) {
    if (
      !key ||
      /[\x00-\x1f\x7f]/.test(key) ||
      !(Array.isArray(item) ? item.every(scalar) : scalar(item))
    )
      throw new Error(
        "Query parameters must contain text, numbers, booleans or arrays of those values.",
      );
    query[key] = Array.isArray(item) ? item.map(String) : String(item);
  }
  return { ...query };
}
function jsonBody(value: unknown): unknown {
  if (value === undefined || value === "") return undefined;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error("JSON body must contain valid JSON.");
    }
  }
  const seen = new Set<object>();
  function valid(value: unknown): boolean {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    )
      return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const result =
      (Array.isArray(value) ||
        [Object.prototype, null].includes(Object.getPrototypeOf(value))) &&
      Object.values(value).every(valid);
    seen.delete(value);
    return result;
  }
  if (!valid(value))
    throw new Error("JSON body must contain valid JSON values.");
  return value;
}
async function executeCustomRequest({
  auth,
  props = {},
  httpClient,
}: {
  auth: unknown;
  props?: Record<string, unknown>;
  httpClient: BirdHttpClient;
}) {
  const accessToken = credentialForAuth(auth);
  const path = apiPath(props["path"]);
  const method = props["method"];
  if (typeof method !== "string" || !methods.includes(method))
    throw new Error(
      "Choose a supported HTTP method: GET, POST, PUT, PATCH, DELETE or HEAD.",
    );
  const headers = requestHeaders(props["headers"]);
  const queryParams = queryParameters(props["queryParams"]);
  const body = jsonBody(props["body"]);
  if (body !== undefined && (method === "GET" || method === "HEAD"))
    throw new Error(
      `The ${method} method does not accept a JSON body. Leave JSON body empty.`,
    );
  const response = await sendBirdRequest({
    accessToken,
    path,
    method,
    headers,
    queryParams,
    body: body === undefined ? undefined : JSON.stringify(body),
    httpClient,
  });
  return {
    status: response.status,
    headers: response.headers ?? {},
    body: response.body,
  };
}

export const birdCustomRequest = { methods, execute: executeCustomRequest };
