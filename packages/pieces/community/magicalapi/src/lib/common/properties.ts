import { Property } from '@activepieces/pieces-framework';

// Base Properties
const urlProperty = Property.ShortText({
  displayName: 'URL',
  description: 'The URL of the resource to be processed',
  required: true,
});

const action = Property.StaticDropdown({
  displayName: 'Action',
  description: 'Select the action to perform',
  required: true,
  options: {
    options: [
      { label: 'Create Task', value: 'create' },
      { label: 'Check Result', value: 'check' },
    ],
  },
});

// Action Properties
export const parseResume = {
  action,
  requestData: Property.DynamicProperties({
    displayName: 'Parse Resume',
    required: true,
    refreshers: ['action'],
    props: async (propsValue) => {
      const action = propsValue['action'] as unknown as
        | 'create'
        | 'check'
        | undefined;
      if (action === 'create') {
        return Promise.resolve({
          url: urlProperty,
        });
      }
      if (action === 'check') {
        return Promise.resolve({
          request_id: Property.ShortText({
            displayName: 'Request ID',
            description:
              'The unique identifier for the resume parsing request.',
            required: true,
          }),
        });
      }
      return Promise.resolve({});
    },
  }),
};

export const reviewResume = {
  action,
  requestData: Property.DynamicProperties({
    displayName: 'Review Resume',
    required: true,
    refreshers: ['action'],
    props: async (propsValue) => {
      const action = propsValue['action'] as unknown as
        | 'create'
        | 'check'
        | undefined;
      if (action === 'create') {
        return Promise.resolve({
          url: urlProperty,
        });
      }
      if (action === 'check') {
        return Promise.resolve({
          request_id: Property.ShortText({
            displayName: 'Request ID',
            description: 'The unique identifier for the resume review request.',
            required: true,
          }),
        });
      }
      return Promise.resolve({});
    },
  }),
};

export const getProfileData = {
  action,
  requestData: Property.DynamicProperties({
    displayName: 'Get Profile Data',
    required: true,
    refreshers: ['action'],
    props: async (propsValue) => {
      const action = propsValue['action'] as unknown as
        | 'create'
        | 'check'
        | undefined;
      if (action === 'create') {
        return Promise.resolve({
          profile_name: Property.ShortText({
            displayName: 'Profile Name',
            description:
              'LinkedIn profile username (found in profile URL after /in/).',
            required: true,
          }),
        });
      }
      if (action === 'check') {
        return Promise.resolve({
          request_id: Property.ShortText({
            displayName: 'Request ID',
            description: 'The unique identifier for the profile data request.',
            required: true,
          }),
        });
      }
      return Promise.resolve({});
    },
  }),
};

export const getCompanyData = {
  action,
  requestData: Property.DynamicProperties({
    displayName: 'Get Company Data',
    required: true,
    refreshers: ['action'],
    props: async (propsValue) => {
      const action = propsValue['action'] as unknown as
        | 'create'
        | 'check'
        | undefined;
      if (action === 'create') {
        return Promise.resolve({
          company_name: Property.ShortText({
            displayName: 'Company Name',
            description: 'Name of the company',
            required: true,
          }),
          company_username: Property.ShortText({
            displayName: 'Company Username',
            description:
              'LinkedIn company username (found in company URL after /company/)',
            required: false,
          }),
          company_website: Property.ShortText({
            displayName: 'Company Website',
            description: 'Official website URL of the company',
            required: false,
          }),
        });
      }
      if (action === 'check') {
        return Promise.resolve({
          request_id: Property.ShortText({
            displayName: 'Request ID',
            description: 'The unique identifier for the company data request.',
            required: true,
          }),
        });
      }
      return Promise.resolve({});
    },
  }),
};

export const scoreResume = {
  action,
  requestData: Property.DynamicProperties({
    displayName: 'Score Resume',
    required: true,
    refreshers: ['action'],
    props: async (propsValue) => {
      const action = propsValue['action'] as unknown as
        | 'create'
        | 'check'
        | undefined;
      if (action === 'create') {
        return Promise.resolve({
          url: urlProperty,
          job_description: Property.ShortText({
            displayName: 'Job Description',
            description: 'Job description to score the resume against',
            required: true,
          }),
        });
      }
      if (action === 'check') {
        return Promise.resolve({
          request_id: Property.ShortText({
            displayName: 'Request ID',
            description:
              'The unique identifier for the resume scoring request.',
            required: true,
          }),
        });
      }
      return Promise.resolve({});
    },
  }),
};
