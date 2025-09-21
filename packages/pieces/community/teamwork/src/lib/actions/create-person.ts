import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createPersonAction = createAction({
  auth: teamworkAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Create a new user/contact with specified details and permissions.',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    userType: Property.StaticDropdown({
      displayName: 'User Type',
      description: 'The type of user to create.',
      required: true,
      options: {
        options: [
          { label: 'Administrator', value: 'account' },
          { label: 'Project Administrator', value: 'project-admin' },
          { label: 'Standard User', value: 'account' },
          { label: 'Collaborator', value: 'collaborator' },
          { label: 'Contact', value: 'contact' },
        ],
      },
    }),
    sendWelcomeEmail: Property.Checkbox({
      displayName: 'Send Welcome Email',
      description: 'Send a welcome email to the new user.',
      required: false,
      defaultValue: false,
    }),
    company_id: teamworkProps.company_id(false),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { firstName, lastName, email, userType, sendWelcomeEmail, company_id } = propsValue;

    const personData = {
      'first-name': firstName,
      'last-name': lastName,
      'user-type': userType,
      email: email,
      'send-welcome-email': sendWelcomeEmail ? 'true' : 'false',
      'company-id': company_id,
    };

    if (userType === 'project-admin') {
      Object.assign(personData, {
        administrator: 'false',
        'canAddProjects': 'false',
        'canManagePeople': 'false',
        'canAccessAllProjects': 'true',
        'setProjectAdmin': 'true'
      });
    } else if (userType === 'account') {
      Object.assign(personData, {
        administrator: 'false',
        'canAddProjects': 'false',
        'canManagePeople': 'false',
        'canAccessAllProjects': 'true',
        'setProjectAdmin': 'false'
      });
    }
    
    return await teamworkClient.createPerson(auth as TeamworkAuth, personData);
  },
});