import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';
import { formatDateOnly } from '../../common/helpers';

export const biginUpdateDealAi = createAction({
  auth: biginAuth,
  name: 'bigin_update_deal',
  classification: 'WRITE',
  displayName: 'Update Deal (Agent)',
  description: 'Update an existing deal in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiUpdateResult,
  aiMetadata: {
    description:
      'Updates an existing Bigin deal by id; set Stage to move it through the pipeline. Only the fields you provide are changed. Idempotent: repeating the same update leaves the deal in the same state. Returns the saved record.',
    idempotent: true,
  },
  props: {
    recordId: biginAiProps.id({ displayName: 'Deal ID', description: 'Pipeline record (deal) id. Resolve it with Search Records (Agent) on Pipelines.', required: true }),
    dealName: biginAiProps.text({ displayName: 'Deal Name', description: 'Name of the deal.', required: false }),
    pipelineId: biginAiProps.text({ displayName: 'Pipeline ID', description: 'Pipeline (layout) id from List Pipelines (Agent). Needed when the org has more than one pipeline.', required: false }),
    subPipeline: biginAiProps.text({ displayName: 'Sub-Pipeline', description: 'Sub-pipeline name from List Pipelines (Agent).', required: false }),
    stage: biginAiProps.text({ displayName: 'Stage', description: 'Stage name from List Pipelines (Agent).', required: false }),
    closingDate: biginAiProps.text({ displayName: 'Closing Date', description: 'Expected closing date (YYYY-MM-DD).', required: false }),
    amount: Property.Number({ displayName: 'Amount', description: 'Deal amount.', required: false }),
    contactId: biginAiProps.text({ displayName: 'Contact ID', description: 'Id of the primary contact.', required: false }),
    companyId: biginAiProps.text({ displayName: 'Company ID', description: 'Id of the company (Accounts record).', required: false }),
    ownerId: biginAiProps.ownerId(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Notes about the deal.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;

    const record = biginRecords.mergeAdditionalFields({
      record: {
      Deal_Name: propsValue.dealName ?? undefined,
      Pipeline: biginRecords.lookup(propsValue.pipelineId ?? undefined),
      Sub_Pipeline: propsValue.subPipeline ?? undefined,
      Stage: propsValue.stage ?? undefined,
      Closing_Date: propsValue.closingDate ? formatDateOnly(propsValue.closingDate) : undefined,
      Amount: propsValue.amount ?? undefined,
      Contact_Name: biginRecords.lookup(propsValue.contactId ?? undefined),
      Account_Name: biginRecords.lookup(propsValue.companyId ?? undefined),
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return biginRecords.update({ connection: getBiginConnection(context.auth), module: 'Pipelines', id: propsValue.recordId.trim(), record });
  },
});
