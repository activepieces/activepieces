import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import {
  caseDropdown,
  clientDropdown,
  companyDropdown,
} from '../common/props';

export const createNote = createAction({
  auth: myCaseAuth,
  name: 'createNote',
  displayName: 'Create Note',
  description: 'Creates a note for a case, client, or company',
  props: {
    model_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Select the type of entity to create a note for',
      required: true,
      options: {
        options: [
          { label: 'Case', value: 'case' },
          { label: 'Client', value: 'client' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
    model_fields: Property.DynamicProperties({
      displayName: 'Entity',
      description: 'Select the entity to create a note for',
      required: true,
      refreshers: ['model_type'],
      props: async (propsValue: any): Promise<any> => {
        const modelType = propsValue['model_type'];

        if (!modelType) {
          return {};
        }

        if (modelType === 'case') {
          return {
            case_id: caseDropdown({
              description: 'Select the case',
              required: true,
            }),
          };
        }

        if (modelType === 'client') {
          return {
            client_id: clientDropdown({
              description: 'Select the client',
              required: true,
            }),
          };
        }

        if (modelType === 'company') {
          return {
            company_id: companyDropdown({
              description: 'Select the company',
              required: true,
            }),
          };
        }

        return {};
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the note',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'The body text of the note',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date of the note',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const modelFields = (propsValue.model_fields as any) || {};

    const payload = {
      subject: propsValue.subject,
      note: propsValue.note,
      date: propsValue.date,
    };

    const createNoteFnMap: Record<string, (params: any) => Promise<any>> = {
      case: ({ accessToken, entityId, payload }: any) =>
        myCaseApiService.createCaseNote({
          accessToken,
          caseId: entityId,
          payload,
        }),
      client: ({ accessToken, entityId, payload }: any) =>
        myCaseApiService.createClientNote({
          accessToken,
          clientId: entityId,
          payload,
        }),
      company: ({ accessToken, entityId, payload }: any) =>
        myCaseApiService.createCompanyNote({
          accessToken,
          companyId: entityId,
          payload,
        }),
    };

    const entityIdMap: Record<string, any> = {
      case: modelFields.case_id,
      client: modelFields.client_id,
      company: modelFields.company_id,
    };

    const modelType = propsValue.model_type as string;
    const createNoteFn = createNoteFnMap[modelType];
    const entityId = entityIdMap[modelType];

    if (!createNoteFn) {
      throw new Error(`Invalid model type: ${modelType}`);
    }

    if (!entityId) {
      throw new Error(`No entity ID provided for ${modelType}`);
    }

    return await createNoteFn({
      accessToken: auth.access_token,
      entityId,
      payload,
    });
  },
});
