import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, cleanupData, formatDateForBigin } from '../common/utils';

export const updatePipelineRecordAction = createAction({
  auth: biginAuth,
  name: 'update_pipeline_record',
  displayName: 'Update Pipeline Record',
  description: 'Update an existing pipeline record (deal) in Bigin CRM',
  props: {
    recordId: Property.ShortText({
      displayName: 'Pipeline Record ID',
      description: 'ID of the pipeline record to update',
      required: true
    }),
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal',
      required: false
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Deal amount',
      required: false
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description: 'Current stage of the deal',
      required: false
    }),
    closingDate: Property.DateTime({
      displayName: 'Closing Date',
      description: 'Expected closing date of the deal',
      required: false
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Name of the primary contact for this deal',
      required: false
    }),
    accountName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company associated with this deal',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the deal',
      required: false
    }),
    pipeline: Property.ShortText({
      displayName: 'Pipeline',
      description: 'Pipeline name or ID',
      required: false
    }),
    subPipeline: Property.ShortText({
      displayName: 'Sub Pipeline',
      description: 'Sub pipeline name',
      required: false
    })
  },
  async run(context) {
    const {
      recordId,
      dealName,
      amount,
      stage,
      closingDate,
      contactName,
      accountName,
      description,
      pipeline,
      subPipeline
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Build pipeline record data (only include fields that are provided)
      const pipelineData = cleanupData({
        [COMMON_FIELDS.PIPELINE_RECORD.DEAL_NAME]: dealName,
        [COMMON_FIELDS.PIPELINE_RECORD.AMOUNT]: amount,
        [COMMON_FIELDS.PIPELINE_RECORD.STAGE]: stage,
        [COMMON_FIELDS.PIPELINE_RECORD.CLOSING_DATE]: closingDate ? formatDateForBigin(closingDate) : undefined,
        [COMMON_FIELDS.PIPELINE_RECORD.CONTACT_NAME]: contactName,
        [COMMON_FIELDS.PIPELINE_RECORD.ACCOUNT_NAME]: accountName,
        [COMMON_FIELDS.PIPELINE_RECORD.DESCRIPTION]: description,
        Pipeline: pipeline,
        Sub_Pipeline: subPipeline
      });

      // Update pipeline record
      const response = await client.updatePipelineRecord(recordId, pipelineData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Pipeline record updated successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to update pipeline record: ${error.message}`);
    }
  }
});
