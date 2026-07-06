import { createAction, Property } from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';
import { beeboleProps } from '../common/props';

type CreatePersonResponse = {
  status: string;
  person?: {
    id: number;
    name: string;
    email?: string;
    userGroup?: string;
    company?: { id: number; name?: string };
  };
  message?: string;
};

export const createPersonAction = createAction({
  auth: beeboleAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Creates a new person in Beebole. An available license is required for the person to be active.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a person (employee, project lead, or admin) under a given company in Beebole, optionally emailing them a login invitation when an email is provided. Use to onboard a new team member or contact. Not idempotent: each call creates a new person record and may re-send an invite, with no de-duplication on name or email.',
    idempotent: false,
  },
  props: {
    company: beeboleProps.companyDropdown({
      required: true,
      description: 'The company this person belongs to.',
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The full name of the person (e.g. "Jane Doe").',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address. Required if you want to invite the person to log in to Beebole.',
      required: false,
    }),
    invite: Property.Checkbox({
      displayName: 'Send Invitation Email',
      description: 'Send an invitation email so the person can log in to Beebole. Requires an email address.',
      required: false,
      defaultValue: false,
    }),
    userGroup: Property.StaticDropdown({
      displayName: 'User Group',
      description: 'The permission level for this person. "Employee" can log time; "Project Lead" can also manage projects; "Admin" has full access.',
      required: false,
      defaultValue: 'employee',
      options: {
        options: [
          { label: 'Employee', value: 'employee' },
          { label: 'Project Lead', value: 'project_lead' },
          { label: 'Administrator', value: 'admin' },
        ],
      },
    }),
  },
  async run(context) {
    const person: Record<string, unknown> = {
      name: context.propsValue.name,
      company: { id: context.propsValue.company },
    };
    if (context.propsValue.email) {
      person['email'] = context.propsValue.email;
    }
    if (context.propsValue.invite !== undefined) {
      person['invite'] = context.propsValue.invite;
    }
    if (context.propsValue.userGroup) {
      person['userGroup'] = context.propsValue.userGroup;
    }

    const response = await beeboleClient.call<CreatePersonResponse>({
      token: context.auth.secret_text,
      body: { service: 'person.create', person },
    });

    if (response.body.status !== 'ok') {
      throw new Error(`Beebole returned an error: ${response.body.message ?? 'Unknown error'}`);
    }
    
    return response.body
  },
});
