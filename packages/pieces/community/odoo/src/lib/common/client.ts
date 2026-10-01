import { Client, createClient, createSecureClient } from 'xmlrpc';

function resolvePort(port: OdooAuthProps['port']): number {
  if (port === undefined || port === null || port === '') {
    return DEFAULT_ODOO_PORT;
  }
  const value = typeof port === 'number' ? port : Number(String(port).trim());
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(
      `Invalid Odoo port "${port}". Use a whole number between 1 and 65535, or leave it empty for 443.`,
    );
  }
  return value;
}

function resolveConnection(auth: OdooAuthProps): OdooConnection {
  const url = parseUrl(auth.base_url);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The Odoo URL must start with https:// or http://');
  }
  if (url.username || url.password) {
    throw new Error('The Odoo URL must not contain a user name or password.');
  }
  return {
    host: url.hostname,
    port: resolvePort(auth.port),
    secure: url.protocol === 'https:',
    db: auth.database,
    username: auth.username,
    password: auth.api_key,
  };
}

function faultText(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof OdooRequestError && (typeof error.raw === 'string' || (typeof error.raw === 'object' && error.raw !== null))) {
    return faultText(error.raw);
  }
  if (error instanceof Error) {
    const fault: unknown = Reflect.get(error, 'faultString');
    return typeof fault === 'string' ? fault : error.message;
  }
  if (error && typeof error === 'object') {
    const fault: unknown = Reflect.get(error, 'faultString');
    if (typeof fault === 'string') return fault;
    const message: unknown = Reflect.get(error, 'message');
    if (typeof message === 'string') return message;
  }
  return String(error);
}

function isNoneReturnFault(error: unknown): boolean {
  return /cannot marshal None/i.test(faultText(error));
}

function isAccessFault(error: unknown): boolean {
  return /AccessError|access rights|not allowed to access|AccessDenied/i.test(faultText(error));
}

function isMissingModelFault(error: unknown): boolean {
  return /Object [\w.]+ doesn't exist/.test(faultText(error));
}

function describeError(error: unknown): string {
  const text = faultText(error).trim();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const message = /Traceback \(most recent call last\)/.test(text)
    ? lines.length > 0
      ? lines[lines.length - 1]
      : text
    : lines.join(' ');
  return message.length > 600 ? `${message.slice(0, 600)}…` : message;
}

function cleanValue(value: unknown): unknown {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error(`Invalid number ${value} in an Odoo request.`);
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : cleanValue(item)));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, cleanValue(item)]),
    );
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value)
  );
}

function parseUrl(value: unknown): URL {
  try {
    return new URL(String(value ?? '').trim());
  } catch {
    throw new Error('Invalid Odoo URL. Use the full address, for example https://mycompany.odoo.com');
  }
}

const defaultFactory: ClientFactory = ({ options, secure }) =>
  secure ? createSecureClient(options) : createClient(options);

export class OdooRequestError extends Error {
  readonly raw: unknown;

  constructor({ message, raw }: { message: string; raw: unknown }) {
    super(message);
    this.name = 'OdooRequestError';
    this.raw = raw;
  }
}

export class OdooClient {
  readonly connection: OdooConnection;
  private readonly factory: ClientFactory;
  private uid: number | null = null;
  private readonly fieldsCache = new Map<string, OdooFieldMap>();

  constructor({ connection, factory = defaultFactory }: { connection: OdooConnection; factory?: ClientFactory }) {
    this.connection = connection;
    this.factory = factory;
  }

  static fromAuth({ auth, factory }: { auth: OdooAuthProps; factory?: ClientFactory }): OdooClient {
    return new OdooClient({ connection: resolveConnection(auth), factory });
  }

  private rpc<T>({ path, method, params }: { path: string; method: string; params: unknown[] }): Promise<T> {
    const client = this.factory({
      options: { host: this.connection.host, port: this.connection.port, path },
      secure: this.connection.secure,
    });
    return new Promise<T>((resolve, reject) => {
      client.methodCall(method, params, (error, value) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
  }

  async version(): Promise<Record<string, unknown>> {
    try {
      return await this.rpc<Record<string, unknown>>({ path: '/xmlrpc/2/common', method: 'version', params: [] });
    } catch (error) {
      throw new OdooRequestError({ message: `Could not reach Odoo: ${describeError(error)}`, raw: error });
    }
  }

  async authenticate(): Promise<number> {
    if (this.uid !== null) return this.uid;
    let value: unknown;
    try {
      value = await this.rpc<unknown>({
        path: '/xmlrpc/2/common',
        method: 'authenticate',
        params: [this.connection.db, this.connection.username, this.connection.password, {}],
      });
    } catch (error) {
      throw new OdooRequestError({ message: `Could not reach Odoo: ${describeError(error)}`, raw: error });
    }
    if (typeof value !== 'number' || value <= 0) {
      throw new OdooRequestError({
        message: 'Odoo rejected the login. Check the database name, the username and the API key.',
        raw: value,
      });
    }
    this.uid = value;
    return value;
  }

  async call<T = unknown>(request: OdooCallRequest): Promise<T> {
    const result = await this.callAllowNone<T>({ ...request, allowNone: false });
    if (result.returnedNone) {
      throw new OdooRequestError({ message: `Odoo ${request.model}.${request.method} returned nothing.`, raw: null });
    }
    return result.value;
  }

  async callAllowNone<T = unknown>({
    model,
    method,
    args = [],
    kwargs = {},
    allowNone = true,
  }: OdooCallRequest & { allowNone?: boolean }): Promise<OdooCallResult<T>> {
    const uid = await this.authenticate();
    const params = [
      this.connection.db,
      uid,
      this.connection.password,
      model,
      method,
      cleanValue(args),
      cleanValue(kwargs),
    ];
    try {
      const value = await this.rpc<T>({ path: '/xmlrpc/2/object', method: 'execute_kw', params });
      return { value, returnedNone: false };
    } catch (error) {
      if (allowNone && isNoneReturnFault(error)) {
        return { value: null, returnedNone: true };
      }
      throw new OdooRequestError({ message: `Odoo ${model}.${method} failed: ${describeError(error)}`, raw: error });
    }
  }

  async fieldsGet(model: string): Promise<OdooFieldMap> {
    const cached = this.fieldsCache.get(model);
    if (cached) return cached;
    const fields = await this.call<OdooFieldMap>({
      model,
      method: 'fields_get',
      args: [],
      kwargs: { attributes: ['string', 'type', 'required', 'readonly', 'relation', 'selection', 'help', 'store'] },
    });
    this.fieldsCache.set(model, fields);
    return fields;
  }

  async availableFields({ model, wanted }: { model: string; wanted: readonly string[] }): Promise<string[]> {
    const fields = await this.fieldsGet(model);
    return wanted.filter((name) => name === 'id' || name in fields);
  }
}

export const DEFAULT_ODOO_PORT = 443;

export const odooRpc = {
  resolvePort,
  resolveConnection,
  faultText,
  describeError,
  isNoneReturnFault,
  isAccessFault,
  isMissingModelFault,
  cleanValue,
};

export type OdooAuthProps = {
  base_url: string;
  database: string;
  username: string;
  api_key: string;
  port?: number | string | null;
};

export type OdooConnection = {
  host: string;
  port: number;
  secure: boolean;
  db: string;
  username: string;
  password: string;
};

export type OdooCallRequest = {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
};

export type OdooCallResult<T> = { value: T; returnedNone: false } | { value: null; returnedNone: true };

export type ClientFactory = (params: {
  options: { host: string; port: number; path: string };
  secure: boolean;
}) => Client;

export type OdooFieldInfo = {
  string?: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  relation?: string;
  selection?: [string, string][] | false;
  help?: string | false;
  store?: boolean;
};

export type OdooFieldMap = Record<string, OdooFieldInfo>;
