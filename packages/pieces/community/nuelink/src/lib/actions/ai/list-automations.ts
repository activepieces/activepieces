import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';
import { nuelinkInputs } from '../../common/inputs';
import { nuelinkProps } from '../../common/props';

export const aiListAutomations = createAction({
  name: 'nuelink_list_automations',
  classification: 'SEARCH',
  auth: nuelinkAuths,
  displayName: 'List Feed Automations',
  description: 'Lists a brand\'s RSS and feed automations.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the brand\'s feed automations (id, name, collectionId, status, feed type, feedUrl, runCount, lastRun as a Unix timestamp, title/caption templates). Use it to find an automationId for nuelink_update_automation_status. status may read INACTIVE for a paused automation. One page per call with hasMore. Read-only.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    page: nuelinkProps.page(),
    perPage: nuelinkProps.perPage(),
  },
  outputSchema: nuelinkOutputSchemas.listAutomations,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const { page, perPage } = nuelinkInputs.paging({ page: context.propsValue.page, perPage: context.propsValue.perPage });
    return nuelinkClient.getPage({ apiKey, path: ['brands', brandId, 'automations'], page, perPage });
  },
});
