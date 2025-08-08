import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyDropdown, contactsDropdown, layoutsDropdown, pipelineRecordsDropdown, productsDropdown, SubPipelineorStageDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { biginApiService } from '../common/request';
import { formatDateOnly } from '../common/helpers';

export const updatePipelineRecord = createAction({
  auth: biginAuth,
  name: 'updatePipeline',
  displayName: 'Update Pipeline',
  description: 'updates a pipeline record in Bigin',
  props: {
    pipelineRecordId: pipelineRecordsDropdown,
    pipelineDetails: Property.DynamicProperties({
      displayName: 'Pipeline Details',
      description: 'These fields will be prepopulated with pipeline data',
      refreshers: ['pipelineRecordId', 'auth'],
      required: true,
      props: async (propsValue: any) => {
        const pipelineData = JSON.parse(propsValue.pipelineRecordId);
        const pipelineId = pipelineData.id;
        if (!pipelineId) {
          throw new Error('Pipeline ID is required to update the record');
        }

        return {
          dealName: Property.ShortText({
            displayName: 'Deal Name',
            description: 'Provide the name for the pipeline record (deal)',
            required: true,
            defaultValue: pipelineData.Deal_Name || '',
          }),
          amount: Property.Number({
            displayName: 'Amount',
            description: 'The amount of the pipeline record (deal)',
            required: false,
            defaultValue: pipelineData.Amount || 0,
          }),
          // had to comment this out because the API refuses to accept data when field is included even though correct payload is provided as per documentation https://www.bigin.com/developer/docs/apis/v2/insert-records.html.
          // secondaryContacts: multiContactsDropdown,
          closingDate: Property.DateTime({
            displayName: 'Closing Date',
            description:
              'Provide the expected or actual closing date of the pipeline record (deal) in YYYY-MM-DD format',
            required: false,
            defaultValue: pipelineData.Closing_Date || '',
          }),
        };
      },
    }),
    pipeline: layoutsDropdown(
      'Pipelines',
      'Provide the Team Pipeline to which the pipeline record (deal) belongs',
      'Pipelines'
    ),
    subPipeline: SubPipelineorStageDropdown(
      'Sub Pipeline',
      'Pick one of the configured sub-pipelines',
      'Sub Pipeline',
    ),
    stage: SubPipelineorStageDropdown(
      'Stage',
      'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      'Stage',
    ),
    owner: usersDropdown,
    accountName: companyDropdown,
    contactName: contactsDropdown,
    associatedProducts: productsDropdown,
    tag: tagsDropdown('Pipelines'),
  },
  async run({propsValue, auth}) {
    const pipelineData = JSON.parse(propsValue.pipelineRecordId as string);

    const payload: any = {
      id: pipelineData.id,
    };

    if (propsValue.owner) payload.Owner = propsValue.owner;
    if (propsValue.accountName)
      payload.Account_Name = { id: propsValue.accountName };
    if (propsValue.contactName)
      payload.Contact_Name = { id: propsValue.contactName };

    if (propsValue.subPipeline)
      payload['Sub Pipeline'] = propsValue.subPipeline;

    if (propsValue.stage) payload.Stage = propsValue.stage;
    if (propsValue.pipelineDetails['dealName']) payload.Deal_Name = propsValue.pipelineDetails['dealName'];

    // had to comment this out because the API refuses to accept data when field is included even though correct payload is provided as per documentation https://www.bigin.com/developer/docs/apis/v2/insert-records.html.
    // if (propsValue.secondaryContacts)
    //   payload.Secondary_Contacts = propsValue.secondaryContacts.map(
    //     (contact: any) => ({
    //       id: contact,
    //     })
    //   );

    if (propsValue.pipelineDetails['amount']) payload.Amount = propsValue.pipelineDetails['amount'];
    if (propsValue.pipelineDetails['closingDate'])
      payload.Closing_Date = formatDateOnly(
        propsValue.pipelineDetails['closingDate']
      );
    if (propsValue.pipeline) {
      const pipeline = JSON.parse(propsValue.pipeline as any);
      payload.Pipeline = { id: pipeline.id, name: pipeline.name };
    }

    if (propsValue.associatedProducts) {
      payload.Associated_Products = propsValue.associatedProducts.map(
        (product: any) => {
          const p = JSON.parse(product);
          return { id: p.id, name: p.name };
        }
      );
    }
    if (propsValue.tag) {
      payload.Tag = propsValue.tag.map((t: any) => ({ name: t }));
    }
    
    const {access_token, api_domain} = auth as any;

   try {
     const response = await biginApiService.updatePipelineRecord(
       access_token,
       api_domain,
       { data: [payload] }
     );

      return {
        message: 'Pipeline record updated successfully',
        pipelineRecord: response.data[0],
      };
   } catch (error: any) {
     console.error('Error updating pipeline record:', error);
     throw new Error(error);
   }
  },
});
