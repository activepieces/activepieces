import crypto from 'crypto';
import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  CustomAuthProps,
  StaticPropsValue,
  Store,
  StoreScope,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

type EncryptedObject = {
  iv: string;
  data: string;
};

const algorithm = 'aes-256-cbc';
const ivLength = 16;
const SESSION_TOKEN_KEY = '_session_token';

function encryptString(inputString: string, key: string): EncryptedObject {
  const iv = crypto.randomBytes(ivLength); // Generate a random initialization vector
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(key, 'binary'),
    iv
  ); // Create a cipher with the key and initialization vector
  let encrypted = cipher.update(inputString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    data: encrypted,
  };
}

function decryptString(encryptedObject: EncryptedObject, key: string): string {
  const iv = Buffer.from(encryptedObject.iv, 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key!, 'binary'),
    iv
  );
  let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function refreshSessionToken(
  auth: StaticPropsValue<CustomAuthProps>
) {
  const { username, password, baseUrl } = auth;

  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${baseUrl}/api/session`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  };
  const tokenResponse = await httpClient.sendRequest(request);
  return tokenResponse.body['id'];
}

async function storeSessionToken(
  sessionToken: string,
  encryptionKey: string,
  store: Store<StoreScope>
) {
  return store.put(
    SESSION_TOKEN_KEY,
    encryptString(sessionToken, encryptionKey as string),
    StoreScope.FLOW
  );
}

export async function queryApiAndHandleRefresh(
  params: {
    endpoint: string;
    method: HttpMethod;
    queryParams?: QueryParams;
    headers?: HttpHeaders;
    body?: object;
  },
  auth: StaticPropsValue<CustomAuthProps>,
  store: Store<StoreScope>
) {
  const { baseUrl, encryptionKey } = auth;
  let sessionToken;
  const encryptedToken = await store.get(SESSION_TOKEN_KEY, StoreScope.FLOW);
  if (isNil(encryptedToken)) {
    sessionToken = await refreshSessionToken(auth);
    await storeSessionToken(sessionToken, encryptionKey as string, store);
  } else {
    try {
      sessionToken = decryptString(
        encryptedToken as EncryptedObject,
        encryptionKey as string
      );
    } catch (e) {
      // This can happen when e.g. the connection / encryption key has changed
      sessionToken = await refreshSessionToken(auth);
      await storeSessionToken(sessionToken, encryptionKey as string, store);
    }
  }

  const request: HttpRequest = {
    method: params.method,
    url: `${baseUrl}/api/${params.endpoint}`,
    queryParams: params.queryParams,
    headers: {
      ...params.headers,
      'Content-Type': 'application/json',
      'X-Metabase-Session': sessionToken,
    },
    body: JSON.stringify(params.body),
  };
  try {
    return (await httpClient.sendRequest(request)).body;
  } catch (error) {
    const httpError = error as HttpError;
    if (httpError.response.status === 401) {
      const sessionToken = await refreshSessionToken(auth);
      await storeSessionToken(sessionToken, encryptionKey as string, store);
      return (await httpClient.sendRequest(request)).body;
    }
    throw error;
  }
}
