import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const createPipeline = createAction({
  auth: biginZohoAuth,
  name: 'createPipeline',
  displayName: 'Create Pipeline Record',
  description: 'Create a new pipeline record (deal) in Bigin',
  props: {
    owner: Property.Dropdown({
      displayName: 'Owner',
      description: 'Select the owner of the pipeline record',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/users',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const users = response.users || [];
          return {
            disabled: false,
            options: users.map((user: any) => ({
              label: user.full_name || `${user.first_name} ${user.last_name}`,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Provide the name for the pipeline record (deal)',
      required: true,
    }),
    accountName: Property.Dropdown({
      displayName: 'Account Name',
      description: 'Select the company for this pipeline record',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Accounts',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const companies = response.data || [];
          return {
            disabled: false,
            options: companies.map((company: any) => ({
              label: company.Account_Name,
              value: company.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    subPipeline: Property.Dropdown({
      displayName: 'Sub Pipeline',
      description: 'Select the sub-pipeline for this deal',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/settings/modules',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const modules = response.modules || [];
          const pipelineModule = modules.find((module: any) => module.api_name === 'Pipelines');
          const subPipelines = pipelineModule?.sub_pipelines || [];
          return {
            disabled: false,
            options: subPipelines.map((pipeline: any) => ({
              label: pipeline.name,
              value: pipeline.name,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    stage: Property.Dropdown({
      displayName: 'Stage',
      description: 'Select the stage for this deal',
      required: true,
      refreshers: ['subPipeline'],
      options: async ({ auth, subPipeline }) => {
        if (!subPipeline) {
          return {
            disabled: true,
            options: [],
          };
        }
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/settings/modules',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const modules = response.modules || [];
          const pipelineModule = modules.find((module: any) => module.api_name === 'Pipelines');
          const subPipeline = pipelineModule?.sub_pipelines?.find((p: any) => p.name === subPipeline);
          const stages = subPipeline?.stages || [];
          return {
            disabled: false,
            options: stages.map((stage: any) => ({
              label: stage.name,
              value: stage.name,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    contactName: Property.Dropdown({
      displayName: 'Contact Name',
      description: 'Select the contact for this pipeline record',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/Contacts',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const contacts = response.data || [];
          return {
            disabled: false,
            options: contacts.map((contact: any) => ({
              label: contact.Full_Name || `${contact.First_Name} ${contact.Last_Name}`,
              value: contact.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the pipeline record (deal)',
      required: false,
    }),
    secondaryContacts: Property.Array({
      displayName: 'Secondary Contacts',
      description: 'Provide a list of additional contacts associated with the pipeline record',
      required: false,
    }),
    closingDate: Property.DateTime({
      displayName: 'Closing Date',
      description: 'Provide the expected or actual closing date of the pipeline record',
      required: false,
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description: 'Tags for the pipeline record',
      required: false,
    }),
    pipeline: Property.Dropdown({
      displayName: 'Pipeline',
      description: 'Select the pipeline for this deal',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/settings/modules',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const modules = response.modules || [];
          const pipelineModule = modules.find((module: any) => module.api_name === 'Pipelines');
          const pipelines = pipelineModule?.pipelines || [];
          return {
            disabled: false,
            options: pipelines.map((pipeline: any) => ({
              label: pipeline.name,
              value: pipeline.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
          };
        }
      },
    }),
    associatedProducts: Property.Array({
      displayName: 'Associated Products',
      description: 'Products associated with this pipeline record',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      Deal_Name: context.propsValue.dealName,
      Sub_Pipeline: context.propsValue.subPipeline,
      Stage: context.propsValue.stage,
    };

    if (context.propsValue.owner) body['Owner'] = { id: context.propsValue.owner };
    if (context.propsValue.accountName) body['Account_Name'] = { id: context.propsValue.accountName };
    if (context.propsValue.contactName) body['Contact_Name'] = { id: context.propsValue.contactName };
    if (context.propsValue.amount !== undefined) body['Amount'] = context.propsValue.amount;
    if (context.propsValue.secondaryContacts) body['Secondary_Contacts'] = context.propsValue.secondaryContacts;
    if (context.propsValue.closingDate) body['Closing_Date'] = context.propsValue.closingDate;
    if (context.propsValue.tag && context.propsValue.tag.length > 0) {
      body['Tag'] = context.propsValue.tag.map((tag: unknown) => ({ name: tag as string }));
    }
    if (context.propsValue.pipeline) body['Pipeline'] = { id: context.propsValue.pipeline };
    if (context.propsValue.associatedProducts) body['Associated_Products'] = context.propsValue.associatedProducts;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Pipelines',
      context.auth.props?.['location'] || 'com',
      { data: [body] }
    );

    return {
      message: 'Pipeline record (deal) created successfully',
      data: response.data[0],
    };
  },
}); 