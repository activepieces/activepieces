import { createAction, Property } from '@activepieces/pieces-framework';
import { beeboleClient } from '../common/client';
import { beeboleAuth } from '../common/auth';

type CreateCompanyResponse = {
  status: string;
  company?: {
    id: number;
    name: string;
    corporate?: boolean;
    active?: boolean;
  };
  message?: string;
};

export const createCompanyAction = createAction({
  auth: beeboleAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company (customer) in Beebole.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a company in Beebole, either an external customer or, when marked internal/corporate, your own organization. Use as the top-level container before creating projects under it. Not idempotent: each call creates a new company even if one with the same name already exists.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company (customer) to create.',
      required: true,
    }),
    corporate: Property.Checkbox({
      displayName: 'Internal Company',
      description: 'Enable if this company represents your own organization (internal/corporate) rather than a customer.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const response = await beeboleClient.call<CreateCompanyResponse>({
      token: context.auth.secret_text,
      body: {
        service: 'company.create',
        company: {
          name: context.propsValue.name,
          corporate: context.propsValue.corporate ?? false,
        },
      },
    });

    if (response.body.status !== 'ok') {
      throw new Error(`Beebole returned an error: ${response.body.message ?? 'Unknown error'}`);
    }

    
    return response.body
  },
});
