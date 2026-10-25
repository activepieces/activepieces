import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyClient, NetlifyApiError, NetlifyAuthValue } from './client';

const SITE_SECRET_KEYS = ['jwt_secret'];
const SECRET_SCOPES = ['builds', 'functions', 'runtime'];
const { request, segment, pageSize, pageNumber, isRecord } = netlifyClient;

async function getSite({ auth, siteId }: { auth: NetlifyAuthValue; siteId: unknown }) {
  const response = await request({ auth, method: HttpMethod.GET, path: `/sites/${segment({ value: siteId, label: 'Site' })}` });
  return withoutSecrets(response.body);
}

async function listSites({ auth, name, page, perPage }: { auth: NetlifyAuthValue; name?: string; page?: unknown; perPage?: unknown }) {
  const response = await request({
    auth,
    method: HttpMethod.GET,
    path: '/sites',
    query: { filter: 'all', name: name?.trim(), page: pageNumber(page), per_page: pageSize({ value: perPage, label: 'Per Page' }) },
  });
  return Array.isArray(response.body) ? response.body.map(withoutSecrets) : response.body;
}

async function listDeploys({ auth, siteId, page, perPage }: { auth: NetlifyAuthValue; siteId: unknown; page?: unknown; perPage?: unknown }) {
  const response = await request({
    auth,
    method: HttpMethod.GET,
    path: `/sites/${segment({ value: siteId, label: 'Site' })}/deploys`,
    query: { page: pageNumber(page), per_page: pageSize({ value: perPage, label: 'Per Page' }) },
  });
  return response.body;
}

async function listFiles({ auth, siteId }: { auth: NetlifyAuthValue; siteId: unknown }) {
  const response = await request({ auth, method: HttpMethod.GET, path: `/sites/${segment({ value: siteId, label: 'Site' })}/files` });
  return response.body;
}

async function startBuild({ auth, siteId, clearCache }: { auth: NetlifyAuthValue; siteId: unknown; clearCache?: boolean }) {
  const site = await getSite({ auth, siteId });
  const id = isRecord(site) && typeof site['id'] === 'string' ? site['id'] : '';
  try {
    const response = await request({
      auth,
      method: HttpMethod.POST,
      path: `/sites/${segment({ value: id, label: 'Site' })}/builds`,
      query: { clear_cache: clearCache === true ? true : undefined },
    });
    return response.body;
  } catch (error) {
    if (error instanceof NetlifyApiError && error.status === 404) {
      throw new Error('Netlify cannot build this site: it is not linked to a Git repository (sites deployed by drag and drop or the CLI cannot be rebuilt from Netlify). Link a repository in the site settings first.');
    }
    throw error;
  }
}

async function getDeploy({ auth, deployId }: { auth: NetlifyAuthValue; deployId: unknown }) {
  const response = await request({ auth, method: HttpMethod.GET, path: `/deploys/${segment({ value: deployId, label: 'Deploy ID' })}` });
  return response.body;
}

async function cancelDeploy({ auth, deployId }: { auth: NetlifyAuthValue; deployId: unknown }) {
  const response = await request({ auth, method: HttpMethod.POST, path: `/deploys/${segment({ value: deployId, label: 'Deploy ID' })}/cancel` });
  return response.body;
}

async function restoreDeploy({ auth, deployId }: { auth: NetlifyAuthValue; deployId: unknown }) {
  const deploy = await getDeploy({ auth, deployId });
  const siteId = isRecord(deploy) ? deploy['site_id'] : undefined;
  if (typeof siteId !== 'string' || siteId === '') {
    throw new Error('Netlify did not return the site of this deploy.');
  }
  const response = await request({
    auth,
    method: HttpMethod.POST,
    path: `/sites/${segment({ value: siteId, label: 'Site' })}/deploys/${segment({ value: deployId, label: 'Deploy ID' })}/restore`,
  });
  return response.body;
}

async function setDeployLock({ auth, deployId, locked }: { auth: NetlifyAuthValue; deployId: unknown; locked: boolean }) {
  const response = await request({
    auth,
    method: HttpMethod.POST,
    path: `/deploys/${segment({ value: deployId, label: 'Deploy ID' })}/${locked ? 'lock' : 'unlock'}`,
  });
  return response.body;
}

async function listForms({ auth, siteId }: { auth: NetlifyAuthValue; siteId: unknown }) {
  const response = await request({ auth, method: HttpMethod.GET, path: `/sites/${segment({ value: siteId, label: 'Site' })}/forms` });
  return response.body;
}

async function listSubmissions({ auth, formId, page, perPage }: { auth: NetlifyAuthValue; formId: unknown; page?: unknown; perPage?: unknown }) {
  const response = await request({
    auth,
    method: HttpMethod.GET,
    path: `/forms/${segment({ value: formId, label: 'Form ID' })}/submissions`,
    query: { page: pageNumber(page), per_page: pageSize({ value: perPage, label: 'Per Page' }) },
  });
  return response.body;
}

async function listEnvVars({ auth, siteId, context, scope }: { auth: NetlifyAuthValue; siteId: unknown; context?: string; scope?: string }) {
  const { accountId, site } = await siteAccount({ auth, siteId });
  const response = await request({
    auth,
    method: HttpMethod.GET,
    path: `/accounts/${segment({ value: accountId, label: 'Team' })}/env`,
    query: { site_id: site, context_name: context, scope },
  });
  return response.body;
}

async function setEnvVar({
  auth,
  siteId,
  key,
  value,
  context,
  isSecret,
}: {
  auth: NetlifyAuthValue;
  siteId: unknown;
  key: unknown;
  value: unknown;
  context?: string;
  isSecret?: boolean;
}) {
  const envKey = envKeyOf(key);
  if (typeof value !== 'string') {
    throw new Error('Value is required.');
  }
  const deployContext = context && context.trim() !== '' ? context.trim() : 'all';
  if (isSecret === true && deployContext === 'all') {
    throw new Error('Secret variables need a specific deploy context (e.g. production), not All contexts.');
  }
  const { accountId, site } = await siteAccount({ auth, siteId });
  const account = segment({ value: accountId, label: 'Team' });
  const keyPath = `/accounts/${account}/env/${segment({ value: envKey, label: 'Key' })}`;
  const existing = await findEnvVar({ auth, keyPath, site });
  if (existing === null) {
    const created = await request({
      auth,
      method: HttpMethod.POST,
      path: `/accounts/${account}/env`,
      query: { site_id: site },
      body: [{ key: envKey, is_secret: isSecret === true, ...(isSecret === true ? { scopes: SECRET_SCOPES } : {}), values: [{ context: deployContext, value }] }],
      redactBody: true,
    });
    const first = Array.isArray(created.body) ? created.body[0] : created.body;
    return summarizeEnvVar({ body: first, envKey, deployContext, created: true });
  }
  if (deployContext === 'all') {
    const replaced = await request({
      auth,
      method: HttpMethod.PUT,
      path: keyPath,
      query: { site_id: site },
      body: { key: envKey, scopes: Array.isArray(existing['scopes']) ? existing['scopes'] : undefined, is_secret: existing['is_secret'] === true, values: [{ context: 'all', value }] },
      redactBody: true,
    });
    return summarizeEnvVar({ body: replaced.body, envKey, deployContext, created: false });
  }
  const updated = await request({
    auth,
    method: HttpMethod.PATCH,
    path: keyPath,
    query: { site_id: site },
    body: { context: deployContext, value },
    redactBody: true,
  });
  return summarizeEnvVar({ body: updated.body, envKey, deployContext, created: false });
}

async function deleteEnvVar({ auth, siteId, key }: { auth: NetlifyAuthValue; siteId: unknown; key: unknown }) {
  const envKey = envKeyOf(key);
  const { accountId, site } = await siteAccount({ auth, siteId });
  const keyPath = `/accounts/${segment({ value: accountId, label: 'Team' })}/env/${segment({ value: envKey, label: 'Key' })}`;
  const existing = await findEnvVar({ auth, keyPath, site });
  if (existing === null) {
    return { key: envKey, deleted: false, already_deleted: true };
  }
  await request({ auth, method: HttpMethod.DELETE, path: keyPath, query: { site_id: site } });
  return { key: envKey, deleted: true, already_deleted: false };
}

async function findEnvVar({ auth, keyPath, site }: { auth: NetlifyAuthValue; keyPath: string; site: string }): Promise<Record<string, unknown> | null> {
  try {
    const response = await request({ auth, method: HttpMethod.GET, path: keyPath, query: { site_id: site }, redactBody: true });
    return isRecord(response.body) ? response.body : {};
  } catch (error) {
    if (error instanceof NetlifyApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function siteAccount({ auth, siteId }: { auth: NetlifyAuthValue; siteId: unknown }): Promise<{ accountId: string; site: string }> {
  const site = await getSite({ auth, siteId });
  const accountId = isRecord(site) ? site['account_id'] : undefined;
  const id = isRecord(site) ? site['id'] : undefined;
  if (typeof accountId !== 'string' || accountId === '' || typeof id !== 'string' || id === '') {
    throw new Error('Netlify did not return the team of this site.');
  }
  return { accountId, site: id };
}

function withoutSecrets(site: unknown): unknown {
  if (!isRecord(site)) return site;
  return Object.fromEntries(Object.entries(site).filter(([key]) => !SITE_SECRET_KEYS.includes(key)));
}

function envKeyOf(key: unknown): string {
  const text = typeof key === 'string' ? key.trim() : '';
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    throw new Error('Key must start with a letter or underscore and contain only letters, digits and underscores, e.g. API_URL.');
  }
  return text;
}

function summarizeEnvVar({ body, envKey, deployContext, created }: { body: unknown; envKey: string; deployContext: string; created: boolean }) {
  const record = isRecord(body) ? body : {};
  const values = Array.isArray(record['values']) ? record['values'] : [];
  return {
    key: typeof record['key'] === 'string' ? record['key'] : envKey,
    created,
    context: deployContext,
    scopes: Array.isArray(record['scopes']) ? record['scopes'] : [],
    is_secret: record['is_secret'] === true,
    contexts: values.map((item) => (isRecord(item) ? item['context'] : undefined)).filter((item): item is string => typeof item === 'string'),
  };
}

export const netlifyOperations = {
  getSite,
  listSites,
  listDeploys,
  listFiles,
  startBuild,
  getDeploy,
  cancelDeploy,
  restoreDeploy,
  setDeployLock,
  listForms,
  listSubmissions,
  listEnvVars,
  setEnvVar,
  deleteEnvVar,
};
