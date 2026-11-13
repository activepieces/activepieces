import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';
import { formatDateOnly } from '../../common/helpers';

export const biginCreateDealAi = createAction({
  auth: biginAuth,
  name: 'bigin_create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal (Agent)',
  description: 'Create a new deal in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Creates a new deal (Pipelines record) in Bigin. Deal Name, Sub-Pipeline, Stage and Closing Date are required; get valid Pipeline ID, Sub-Pipeline and Stage values from List Pipelines (Agent). Not idempotent: each call creates a new deal. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    dealName: biginAiProps.text({ displayName: 'Deal Name', description: 'Name of the deal.', required: true }),
    pipelineId: biginAiProps.text({ displayName: 'Pipeline ID', description: 'Pipeline (layout) id from List Pipelines (Agent). Needed when the org has more than one pipeline.', required: false }),
    subPipeline: biginAiProps.text({ displayName: 'Sub-Pipeline', description: 'Sub-pipeline name from List Pipelines (Agent).', required: true }),
    stage: biginAiProps.text({ displayName: 'Stage', description: 'Stage name from List Pipelines (Agent).', required: true }),
    closingDate: biginAiProps.text({ displayName: 'Closing Date', description: 'Expected closing date (YYYY-MM-DD).', required: true }),
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
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Pipelines', record });
  },
});
