import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { companyDropdown, contactsDropdown, layoutsDropdown, multiContactsDropdown, pipelineRecordsDropdown, productsDropdown, SubPipelineorStageDropdown, tagsDropdown, usersDropdown } from '../common/props';
import { formatDateOnly, formatDateTime, handleDropdownError } from '../common/helpers';
import { biginApiService } from '../common/request';

export const createPipelineRecord = createAction({
  auth: biginAuth,
  name: 'createPipeline',
  displayName: 'Create Pipeline',
  description: 'Creates a new pipeline record in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Provide the name for the pipeline record (deal)',
      required: true,
    }),
    pipeline: layoutsDropdown(
      'Pipelines',
      'Provide the Team Pipeline to which the pipeline record (deal) belongs',
      'Pipelines'
    ),
    subPipeline: SubPipelineorStageDropdown(
      'Sub Pipeline',
      'Pick one of the configured sub-pipelines',
      'Sub Pipeline'
    ),
    stage: SubPipelineorStageDropdown(
      'Stage',
      'Provide the current stage of the pipeline record (deal) within the Sub-Pipeline',
      'Stage'
    ),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the pipeline record (deal)',
      required: false,
    }),
    // had to comment this out because the API refuses to accept data when field is included even though correct payload is provided as per documentation https://www.bigin.com/developer/docs/apis/v2/insert-records.html.
    // secondaryContacts: multiContactsDropdown,
    closingDate: Property.DateTime({
      displayName: 'Closing Date',
      description:
        'Provide the expected or actual closing date of the pipeline record (deal) in YYYY-MM-DD format',
      required: false,
    }),
    owner: usersDropdown,
    accountName: companyDropdown,
    contactName: contactsDropdown,
    associatedProducts: productsDropdown,
    tag: tagsDropdown('Pipelines'),
  },
  async run({ propsValue, auth }) {
    const payload: any = {
      Deal_Name: propsValue.dealName,
      Sub_Pipeline: propsValue.subPipeline,
      Stage: propsValue.stage,
    };

    if (propsValue.owner) payload.Owner = propsValue.owner;
    if (propsValue.accountName)
      payload.Account_Name = { id: propsValue.accountName };
    if (propsValue.contactName)
      payload.Contact_Name = { id: propsValue.contactName };

    // had to comment this out because the API refuses to accept data when field is included even though correct payload is provided as per documentation https://www.bigin.com/developer/docs/apis/v2/insert-records.html.
    // if (propsValue.secondaryContacts)
    //   payload.Secondary_Contacts = propsValue.secondaryContacts.map(
    //     (contact: any) => ({
    //       id: contact,
    //     })
    //   );

    if (propsValue.amount) payload.Amount = propsValue.amount;
    if (propsValue.closingDate)
      payload.Closing_Date = formatDateOnly(propsValue.closingDate);
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

    try {
      const { access_token, api_domain } = auth as any;
      const response = await biginApiService.createPipelineRecord(
        access_token,
        api_domain,
        { data: [payload] }
      );
      return response.data[0];
    } catch (error) {
      console.error('Error creating pipeline:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create pipeline: ${error.message}`
          : 'Failed to create pipeline due to an unknown error'
      );
    }
  },
});
