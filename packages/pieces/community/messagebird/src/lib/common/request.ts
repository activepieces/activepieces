import { isRecord } from "./values";
import type {
  BirdHttpClient,
  BirdHttpRequest,
  BirdHttpResponse,
  Field,
  WireOperation,
} from "./types";
import { normalizeFormProps } from "./forms";

export function regionForCredential(accessToken: unknown) {
  if (typeof accessToken !== "string") {
    throw new Error(
      "Connect with Bird OAuth or a current Access Key before running this action.",
    );
  }
  const match = /^b[kt]_([a-z]{2}[0-9]+)_([A-Za-z0-9_-]+)$/.exec(accessToken);
  if (!match)
    throw new Error(
      "The Bird credential is not a current regional access token or Access Key.",
    );
  return match[1];
}

export function credentialForAuth(value: unknown) {
  const auth = isRecord(value) ? value : {};
  if (auth["type"] === "CUSTOM_AUTH") {
    throw new Error(
      "Legacy Channels API connections cannot run this action. Choose Bird OAuth or a current Bird Access Key, or keep the action on MessageBird 0.3.x.",
    );
  }
  let credential;
  if (auth["type"] === "SECRET_TEXT") {
    credential = auth["secret_text"];
    if (typeof credential !== "string" || !/^bk_(eu1|us1)_/.test(credential)) {
      throw new Error(
        "Enter a current Bird Access Key starting with bk_eu1_ or bk_us1_.",
      );
    }
  } else if (
    ["OAUTH2", "CLOUD_OAUTH2", "PLATFORM_OAUTH2"].some(
      (type) => type === auth["type"],
    )
  ) {
    credential = auth["access_token"];
    if (typeof credential !== "string" || !credential.startsWith("bt_")) {
      throw new Error("Reconnect Bird OAuth to obtain a valid access token.");
    }
  } else {
    throw new Error(
      "Connect with Bird OAuth or a current Access Key before running this action.",
    );
  }
  regionForCredential(credential);
  return credential;
}

function inputValue(field: Field, value: unknown): unknown {
  if (
    field.location === "query" &&
    (value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()))
  )
    value = field.resolvedSchema?.["default"];
  if (value === undefined || value === null || value === "") {
    if (field.required) throw new Error(`${field.label} is required.`);
    return undefined;
  }
  if (field.encoding === "json-or-text" && typeof value === "string") {
    if (!value.trimStart().startsWith("{")) return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(
        `${field.label} must contain a valid address or JSON object.`,
      );
    }
  }
  if (field.encoding === "array" && !Array.isArray(value)) {
    throw new Error(`${field.label} must be an array.`);
  }
  if (
    field.encoding === "object" &&
    (typeof value !== "object" || Array.isArray(value))
  ) {
    throw new Error(`${field.label} must be a JSON object.`);
  }
  if (field.encoding === "boolean" && typeof value !== "boolean") {
    throw new Error(`${field.label} must be true or false.`);
  }
  if (
    field.encoding === "number" &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`${field.label} must be a finite number.`);
  }
  if (field.location === "query" && typeof value === "number") {
    const schema = field.resolvedSchema;
    if (schema?.["type"] === "integer" && !Number.isInteger(value))
      throw new Error(`${field.label} must be a whole number.`);
    const minimum = schema?.["minimum"];
    const maximum = schema?.["maximum"];
    if (typeof minimum === "number" && value < minimum)
      throw new Error(`${field.label} must be at least ${minimum}.`);
    if (typeof maximum === "number" && value > maximum)
      throw new Error(`${field.label} must be no greater than ${maximum}.`);
  }
  if (field.encoding === "text" && typeof value !== "string") {
    throw new Error(`${field.label} must be text.`);
  }
  return value;
}

function safeText(value: unknown, token: string) {
  if (typeof value !== "string") return undefined;
  return value
    .replaceAll(token, "[redacted]")
    .replace(/\b(?:bt|bk|brt)_[a-z]{2}[0-9]+_[A-Za-z0-9_-]+/g, "[redacted]");
}

function requestError(error: unknown, token: string) {
  const response =
    isRecord(error) && isRecord(error["response"]) ? error["response"] : {};
  const status = response["status"];
  const responseBody = isRecord(response["body"]) ? response["body"] : {};
  const body = isRecord(responseBody["error"]) ? responseBody["error"] : {};
  const message =
    safeText(body["message"], token) ??
    "The Bird request failed. Try again later.";
  const remediation = safeText(body["remediation"], token);
  const param = safeText(body["param"], token);
  const result = new BirdRequestError(
    [message, param ? `Field: ${param}.` : undefined, remediation]
      .filter(Boolean)
      .join(" "),
  );
  result.name = "BirdRequestError";
  if (typeof status === "number" && Number.isInteger(status))
    result.status = status;
  const code = safeText(body["code"], token);
  if (code) result.code = code;
  if (param) result.param = param;
  return result;
}

export async function executeOperation(
  operation: WireOperation,
  {
    accessToken,
    props = {},
    httpClient,
  }: {
    accessToken: string;
    props?: Record<string, unknown>;
    httpClient: BirdHttpClient;
  },
): Promise<unknown> {
  regionForCredential(accessToken);
  if (!httpClient || typeof httpClient.sendRequest !== "function") {
    throw new Error("The Activepieces HTTP client is unavailable.");
  }
  props = normalizeFormProps(operation, props);
  let path = operation.path;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
  const body: Record<string, unknown> = {};
  const queryParams: Record<string, string | string[]> = {};
  for (const field of operation.fields) {
    const value = inputValue(field, props[field.key]);
    if (value === undefined) continue;
    switch (field.location) {
      case "body":
        body[field.wireName] = value;
        break;
      case "path":
        if (
          typeof value !== "string" ||
          !value.trim() ||
          value === "." ||
          value === ".."
        ) {
          throw new Error(`${field.label} must contain a resource ID.`);
        }
        path = path.replaceAll(
          `{${field.wireName}}`,
          encodeURIComponent(value),
        );
        break;
      case "header":
        if (
          field.wireName.toLowerCase() !== "idempotency-key" ||
          typeof value !== "string" ||
          /[\r\n]/.test(value)
        ) {
          throw new Error(`${field.label} is not a valid request header.`);
        }
        headers[field.wireName] = value;
        break;
      case "query":
        if (Array.isArray(value)) {
          const items = value.filter(
            (item) =>
              item !== null &&
              item !== undefined &&
              !(typeof item === "string" && !item.trim()),
          );
          if (!items.every((item) => typeof item === "string"))
            throw new Error(`${field.label} must contain text values.`);
          if (items.length)
            queryParams[field.wireName] = field.joined
              ? items.join(",")
              : items;
        } else queryParams[field.wireName] = String(value);
        break;
      default:
        throw new Error("The Bird action contains an invalid field location.");
    }
  }
  if (
    !path.startsWith("/v1/") ||
    /[{}?#]/.test(path) ||
    path.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error("The Bird action contains an invalid API path.");
  }
  const response = await sendBirdRequest({
    accessToken,
    path,
    method: operation.method,
    headers,
    queryParams,
    ...(operation.requestSchema ? { body } : {}),
    httpClient,
  });
  return response.body;
}

export async function sendBirdRequest({
  accessToken,
  path,
  method,
  headers = {},
  queryParams = {},
  body,
  httpClient,
}: {
  accessToken: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | string[]>;
  body?: unknown;
  httpClient: BirdHttpClient;
}): Promise<BirdHttpResponse> {
  const region = regionForCredential(accessToken);
  const url = new URL(`https://${region}.platform.bird.com${path}`);
  for (const [key, value] of Object.entries(queryParams)) {
    for (const item of Array.isArray(value) ? value : [value])
      url.searchParams.append(key, String(item));
  }
  const request: BirdHttpRequest = {
    method,
    url: url.toString(),
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    queryParams: {},
    followRedirects: false,
    retries: 0,
    timeout: 30000,
  };
  if (body !== undefined) {
    request.headers["Content-Type"] = "application/json";
    request.body = body;
  }
  try {
    const response = await httpClient.sendRequest(request);
    if (response.status < 200 || response.status >= 300) throw { response };
    return response;
  } catch (error) {
    throw requestError(error, accessToken);
  }
}

class BirdRequestError extends Error {
  status?: number;
  code?: string;
  param?: string;
}
