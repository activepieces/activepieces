import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, greenhouseRequest } from '../common/client';
import { initialStageIdProp, jobIdProp, onBehalfOfProp, sourceIdProp } from '../common/props';

export const createCandidateAction = createAction({
  name: 'create_candidate',
  displayName: 'Create Candidate',
  description:
    'Create a Greenhouse candidate. Harvest requires at least one application when creating a candidate, so this action also requires a target job.',
  auth: greenhouseAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Private Candidate',
      required: false,
      defaultValue: false,
    }),
    emailAddresses: Property.Json({
      displayName: 'Email Addresses',
      description:
        'Optional JSON array, e.g. [{"value":"jane@example.com","type":"work"}].',
      required: false,
    }),
    phoneNumbers: Property.Json({
      displayName: 'Phone Numbers',
      description:
        'Optional JSON array, e.g. [{"value":"+1 555 555 5555","type":"mobile"}].',
      required: false,
    }),
    addresses: Property.Json({
      displayName: 'Addresses',
      description: 'Optional JSON array, e.g. [{"value":"Gaborone","type":"home"}].',
      required: false,
    }),
    websiteAddresses: Property.Json({
      displayName: 'Website Addresses',
      description:
        'Optional JSON array, e.g. [{"value":"https://example.com","type":"personal"}].',
      required: false,
    }),
    socialMediaAddresses: Property.Json({
      displayName: 'Social Media Addresses',
      description: 'Optional JSON array of social profiles.',
      required: false,
    }),
    tags: Property.Json({
      displayName: 'Tags',
      description: 'Optional JSON array of tag strings.',
      required: false,
    }),
    jobId: jobIdProp,
    sourceId: sourceIdProp,
    initialStageId: initialStageIdProp,
    onBehalfOf: onBehalfOfProp,
  },
  async run({ auth, propsValue }) {
    const body = compactObject({
      first_name: propsValue.firstName,
      last_name: propsValue.lastName,
      company: propsValue.company,
      title: propsValue.title,
      is_private: propsValue.isPrivate,
      email_addresses: propsValue.emailAddresses as unknown,
      phone_numbers: propsValue.phoneNumbers as unknown,
      addresses: propsValue.addresses as unknown,
      website_addresses: propsValue.websiteAddresses as unknown,
      social_media_addresses: propsValue.socialMediaAddresses as unknown,
      tags: propsValue.tags as unknown,
      applications: [
        compactObject({
          job_id: propsValue.jobId,
          source_id: propsValue.sourceId,
          initial_stage_id: propsValue.initialStageId,
        }),
      ],
    });

    return greenhouseRequest({
      auth,
      method: HttpMethod.POST,
      path: '/candidates',
      onBehalfOf: propsValue.onBehalfOf,
      body,
    });
  },
});
