import { httpClient, HttpMethod } from '@activepieces/pieces-common';

function ensureString(body: any): string {
  if (typeof body === 'string') {
    return body;
  }
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }
  return String(body);
}

export function getTableauHeaders(authToken: string) {
  return {
    'X-Tableau-Auth': authToken,
    'Accept': 'application/xml',
    'Content-Type': 'application/xml',
  };
}

export function buildTableauUrl(serverUrl: string, apiVersion: string, siteId: string, endpoint: string): string {
  return `${serverUrl}/api/${apiVersion}/sites/${siteId}/${endpoint}`;
}


interface AuthCache {
  token: string;
  siteId: string;
  expiresAt: number;
}

const authCache = new Map<string, AuthCache>();

function getCacheKey(auth: any): string {
  return `${auth.serverUrl}-${auth.siteContentUrl || 'default'}-${auth.username || auth.personalAccessTokenName}`;
}

export async function getAuthToken(auth: any): Promise<{ token: string; siteId: string }> {
  const cacheKey = getCacheKey(auth);
  const now = Date.now();

  const cached = authCache.get(cacheKey);
  if (cached && cached.expiresAt > now + 300000) { 
    return { token: cached.token, siteId: cached.siteId };
  }

  let credentialsXml: string;
  if (auth.username && auth.password) {
    credentialsXml = `<credentials name="${auth.username}" password="${auth.password}">`;
  } else if (auth.personalAccessTokenName && auth.personalAccessTokenSecret) {
    credentialsXml = `<credentials personalAccessTokenName="${auth.personalAccessTokenName}" personalAccessTokenSecret="${auth.personalAccessTokenSecret}">`;
  } else {
    throw new Error('Authentication credentials are missing');
  }

  const siteXml = auth.siteContentUrl ? `<site contentUrl="${auth.siteContentUrl}" />` : '<site />';
  const signinXml = `<?xml version="1.0" encoding="UTF-8"?>
<tsRequest>
  ${credentialsXml}
    ${siteXml}
  </credentials>
</tsRequest>`;

  const apiVersion = auth.apiVersion || '3.26';
  const signinResponse = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${auth.serverUrl}/api/${apiVersion}/auth/signin`,
    headers: {
      'Content-Type': 'application/xml',
      'Accept': 'application/xml',
    },
    body: signinXml,
  });

  if (signinResponse.status !== 200) {
    throw new Error(`Authentication failed: ${signinResponse.status} - ${JSON.stringify(signinResponse.body)}`);
  }

  let authToken: string | null = null;
  let siteId: string | null = null;

  if (typeof signinResponse.body === 'object' && signinResponse.body !== null) {
    const body = signinResponse.body as any;
    
    if (body.tsResponse?.credentials) {
      authToken = body.tsResponse.credentials.token || body.tsResponse.credentials['@token'];
      siteId = body.tsResponse.credentials.site?.id || body.tsResponse.credentials.site?.['@id'];
    } else if (body.credentials) {
      authToken = body.credentials.token || body.credentials['@token'];
      siteId = body.credentials.site?.id || body.credentials.site?.['@id'];
    }
    
    if (!authToken || !siteId) {
      const responseXml = JSON.stringify(signinResponse.body);
      const tokenMatch = responseXml.match(/token["']?\s*:\s*["']?([^"',}\s]+)/);
      const siteIdMatch = responseXml.match(/id["']?\s*:\s*["']?([^"',}\s]+)/);
      authToken = tokenMatch ? tokenMatch[1] : null;
      siteId = siteIdMatch ? siteIdMatch[1] : null;
    }
  } else {
    const responseXml = ensureString(signinResponse.body);
    
    const tokenMatch = responseXml.match(/token="([^"]+)"/);
    authToken = tokenMatch ? tokenMatch[1] : null;
    
    const siteIdMatch = responseXml.match(/<site[^>]*id="([^"]+)"/);
    siteId = siteIdMatch ? siteIdMatch[1] : null;
  }

  if (!authToken || !siteId) {
    throw new Error(`Failed to obtain authentication token or site ID from response. Response type: ${typeof signinResponse.body}. Response: ${JSON.stringify(signinResponse.body).substring(0, 500)}`);
  }


  const isCloud = auth.serverUrl.includes('.online.tableau.com');
  const tokenLifetime = isCloud ? 120 * 60 * 1000 : 240 * 60 * 1000;

  authCache.set(cacheKey, {
    token: authToken,
    siteId,
    expiresAt: now + tokenLifetime,
  });

  return { token: authToken, siteId };
}

export async function listExtractRefreshTasks(auth: any): Promise<any[]> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const listTasksUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, 'tasks/extractRefreshes');

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: listTasksUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to list extract refresh tasks: ${response.status}`);
  }

  const responseBody = ensureString(response.body);

  const tasks: any[] = [];

  const taskMatches = responseBody.matchAll(/<extractRefresh[^>]*id="([^"]+)"[^>]*priority="([^"]*)"[^>]*consecutiveFailedCount="([^"]*)"[^>]*type="([^"]*)"/g);

  for (const match of taskMatches) {
    const [, taskId, priority, consecutiveFailedCount, type] = match;

    const scheduleMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<schedule[^>]*frequency="([^"]*)"[^>]*nextRunAt="([^"]*)"[^>]*>`));
    const frequency = scheduleMatch ? scheduleMatch[1] : null;
    const nextRunAt = scheduleMatch ? scheduleMatch[2] : null;

    const workbookMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<workbook[^>]*id="([^"]+)"`));
    const datasourceMatch = responseBody.match(new RegExp(`<extractRefresh[^>]*id="${taskId}"[^>]*>[\\s\\S]*?<datasource[^>]*id="([^"]+)"`));

    const workbookId = workbookMatch ? workbookMatch[1] : null;
    const datasourceId = datasourceMatch ? datasourceMatch[1] : null;

    tasks.push({
      id: taskId,
      priority: parseInt(priority),
      consecutiveFailedCount: parseInt(consecutiveFailedCount),
      type,
      schedule: {
        frequency,
        nextRunAt,
      },
      workbookId,
      datasourceId,
    });
  }

  return tasks;
}

export async function querySites(auth: any): Promise<any[]> {
  const { token: authToken } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const querySitesUrl = `${auth.serverUrl}/api/${apiVersion}/sites`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: querySitesUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to query sites: ${response.status}`);
  }

  const responseBody = ensureString(response.body);

  const sites: any[] = [];

  const siteMatches = responseBody.matchAll(/<site[^>]*id="([^"]+)"[^>]*name="([^"]+)"[^>]*contentUrl="([^"]*)"[^>]*>/g);

  for (const match of siteMatches) {
    const [, siteId, name, contentUrl] = match;

    sites.push({
      id: siteId,
      name,
      contentUrl,
    });
  }

  return sites;
}

export async function queryWorkbooks(auth: any): Promise<any[]> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const queryWorkbooksUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, 'workbooks');

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: queryWorkbooksUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to query workbooks: ${response.status}`);
  }

  const responseBody = ensureString(response.body);

  const workbooks: any[] = [];

  const workbookMatches = responseBody.matchAll(/<workbook[^>]*id="([^"]+)"[^>]*name="([^"]+)"[^>]*contentUrl="([^"]*)"[^>]*>/g);

  for (const match of workbookMatches) {
    const [, workbookId, name, contentUrl] = match;

    workbooks.push({
      id: workbookId,
      name,
      contentUrl,
    });
  }

  return workbooks;
}

export async function queryViews(auth: any): Promise<any[]> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const queryViewsUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, 'views');

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: queryViewsUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to query views: ${response.status}`);
  }

  const responseBody = ensureString(response.body);

  const views: any[] = [];

  const viewMatches = responseBody.matchAll(/<view[^>]*id="([^"]+)"[^>]*name="([^"]+)"[^>]*contentUrl="([^"]*)"[^>]*viewUrlName="([^"]*)"/g);

  for (const match of viewMatches) {
    const [, viewId, name, contentUrl, viewUrlName] = match;

    views.push({
      id: viewId,
      name,
      contentUrl,
      viewUrlName,
    });
  }

  return views;
}

export interface WebhookData {
  id?: string;
  name: string;
  event: string;
  destinationUrl: string;
}

export async function createWebhook(auth: any, webhookData: WebhookData): Promise<string> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const createWebhookUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, 'webhooks');

  const requestBody = `<?xml version="1.0" encoding="UTF-8"?>
<tsRequest>
  <webhook name="${webhookData.name}" event="${webhookData.event}">
    <webhook-destination>
      <webhook-destination-http method="POST" url="${webhookData.destinationUrl}" />
    </webhook-destination>
  </webhook>
</tsRequest>`;

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: createWebhookUrl,
    headers: {
      ...getTableauHeaders(authToken),
      'Content-Type': 'application/xml',
    },
    body: requestBody,
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create webhook: ${response.status} - ${response.body}`);
  }

  const responseBody = ensureString(response.body);
  const webhookIdMatch = responseBody.match(/<webhook[^>]*id="([^"]+)"/);
  const webhookId = webhookIdMatch ? webhookIdMatch[1] : null;

  if (!webhookId) {
    throw new Error('Failed to extract webhook ID from response');
  }

  return webhookId;
}

export async function deleteWebhook(auth: any, webhookId: string): Promise<void> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const deleteWebhookUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, `webhooks/${webhookId}`);

  const response = await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: deleteWebhookUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 204) {
    throw new Error(`Failed to delete webhook: ${response.status} - ${response.body}`);
  }
}

export async function listWebhooks(auth: any): Promise<any[]> {
  const { token: authToken, siteId } = await getAuthToken(auth);

  const apiVersion = auth.apiVersion || '3.26';
  const listWebhooksUrl = buildTableauUrl(auth.serverUrl, apiVersion, siteId, 'webhooks');

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: listWebhooksUrl,
    headers: getTableauHeaders(authToken),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to list webhooks: ${response.status} - ${response.body}`);
  }

  const responseBody = ensureString(response.body);
  const webhooks: any[] = [];

  const webhookMatches = responseBody.matchAll(/<webhook[^>]*id="([^"]+)"[^>]*name="([^"]+)"[^>]*event="([^"]+)"/g);

  for (const match of webhookMatches) {
    const [, webhookId, name, event] = match;
    webhooks.push({
      id: webhookId,
      name,
      event,
    });
  }

  return webhooks;
}
