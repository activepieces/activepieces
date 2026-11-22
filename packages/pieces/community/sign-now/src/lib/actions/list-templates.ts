import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const listTemplatesAction = createAction({
  auth: signNowAuth,
  name: 'list_templates',
  displayName: 'List Templates',
  description: 'Lists templates in the Templates folder of your SignNow account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists templates in the Templates folder of the connected SignNow account with ID, name, last update and role names. Use it to find a template ID before Create Document From Template; the role names are what Invite to Sign expects. If truncated is true, narrow the name filter or raise the limit.',
    idempotent: true,
  },
  outputSchema: signNowSchemas.templateList,
  props: {
    name_contains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only return templates whose name contains this text.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of templates to return, from 1 to 500.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { name_contains, limit } = context.propsValue;
    const max = limit ?? 50;
    if (!Number.isInteger(max) || max < 1 || max > MAX_LIMIT) {
      throw new Error('Limit must be a whole number from 1 to 500.');
    }
    const token = getSignNowBearerToken(context.auth);
    const root = await signNowClient.request({ token, method: 'GET', path: '/user/folder', operation: 'list folders' });
    const folder = signNowData.recordsAt({ value: root, key: 'folders' }).find(
      (item) => signNowData.textAt({ value: item, key: 'name' }) === TEMPLATES_FOLDER
    );
    const folderId = signNowData.textAt({ value: folder, key: 'id' });
    if (folderId === undefined || folderId === '') {
      return { count: 0, total: 0, truncated: false, templates: [] };
    }
    const needle = name_contains?.trim().toLowerCase() ?? '';
    const pages = await collectPages({ token, folderId });
    const all = pages.items
      .map((template) => ({
        id: signNowData.textAt({ value: template, key: 'id' }) ?? null,
        name: signNowData.textAt({ value: template, key: 'document_name' }) ?? null,
        updated: signNowData.numberAt({ value: template, key: 'updated' }) ?? null,
        roles: signNowData.roleNamesOf(template),
      }))
      .filter((template) => needle === '' || (template.name ?? '').toLowerCase().includes(needle));
    const templates = all.slice(0, max);
    return {
      count: templates.length,
      total: needle === '' ? pages.total : all.length,
      truncated: all.length > templates.length || pages.truncated,
      templates,
    };
  },
});

async function collectPages({ token, folderId }: { token: string; folderId: string }): Promise<{ items: Record<string, unknown>[]; total: number; truncated: boolean }> {
  const items: Record<string, unknown>[] = [];
  let total = 0;
  for (let offset = 0; offset < SCAN_CAP; offset += PAGE_SIZE) {
    const page = await signNowClient.request({
      token,
      method: 'GET',
      path: `/user/folder/${signNowClient.segment(folderId)}`,
      query: { limit: PAGE_SIZE, offset },
      operation: 'list templates',
    });
    const documents = signNowData.recordsAt({ value: page, key: 'documents' });
    total = signNowData.numberAt({ value: page, key: 'total_documents' }) ?? offset + documents.length;
    items.push(...documents);
    if (documents.length < PAGE_SIZE || items.length >= total) {
      return { items, total, truncated: false };
    }
  }
  return { items, total, truncated: total > items.length };
}

const MAX_LIMIT = 500;
const TEMPLATES_FOLDER = 'Templates';
const PAGE_SIZE = 100;
const SCAN_CAP = 1000;
