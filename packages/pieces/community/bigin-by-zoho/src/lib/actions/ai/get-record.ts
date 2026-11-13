import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginGetRecordAi = createAction({
  auth: biginAuth,
  name: 'bigin_get_record',
  classification: 'READ',
  displayName: 'Get Record (Agent)',
  description: 'Get one Bigin record by module and id.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiGetRecord,
  aiMetadata: {
    description:
      'Returns every field of one Bigin record (contact, company, deal, product, task, event or call) by its id. Use when you already know the id; to find an id use Search Records (Agent) or List Records (Agent). Fails with a not-found error when no record has that id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    module: biginAiProps.module('The Bigin module the record belongs to.'),
    recordId: biginAiProps.id({ displayName: 'Record ID', description: 'The Bigin record id.', required: true }),
  },
  async run(context) {
    const record = await biginRecords.get({
      connection: getBiginConnection(context.auth),
      module: context.propsValue.module,
      id: context.propsValue.recordId.trim(),
    });
    return { record };
  },
});
