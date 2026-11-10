import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const listTemplates = createAction({
  auth: pandadocAuth,
  name: 'list_templates',
  classification: 'SEARCH',
  displayName: 'List Templates',
  description: 'Lists or searches templates.',
  audience: 'both',
  aiMetadata: {
    description: 'List PandaDoc templates, optionally filtered by name text, tag or folder ID. Returns template IDs to use with Create Document from Template and Get Template Details. Up to 100 per page. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search Text', description: 'Matches template name.', required: false }),
    tag: Property.ShortText({ displayName: 'Tag', required: false }),
    folder_id: Property.ShortText({ displayName: 'Folder ID', required: false }),
    count: Property.Number({ displayName: 'Results per Page', description: '1 to 100, default 50.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Starts at 1.', required: false }),
  },
  outputSchema: pandadocSchemas['templateList'],
  async run({ auth, propsValue }) {
    const tag = pandadocInputs.optionalString(propsValue.tag);
    return pandadocApi.listTemplates({
      apiKey: auth.secret_text,
      query: {
        q: pandadocInputs.optionalString(propsValue.query),
        tag: tag === undefined ? undefined : [tag],
        folder_uuid: pandadocInputs.optionalString(propsValue.folder_id),
        count: pandadocInputs.boundedCount({ value: propsValue.count, label: 'Results per Page' }),
        page: pandadocInputs.positivePage(propsValue.page),
      },
    });
  },
});
