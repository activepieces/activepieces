import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const listCasesAction = createAction({
  name: 'list_cases',
  auth: outsetaAuth,
  displayName: 'List Cases',
  description:
    'Retrieve a paginated list of support tickets (cases) from Outseta. Optionally filter by the person who submitted them.',
  props: {
    fromPersonUid: Property.ShortText({
      displayName: 'From Person UID',
      required: false,
      description:
        'Optional. Only return cases submitted by this person.',
    }),
    fromPersonEmail: Property.ShortText({
      displayName: 'From Person Email',
      required: false,
      description:
        'Optional. Only return cases submitted by the person with this email.',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 100,
      description: 'Maximum number of cases to return (default 100).',
    }),
    offset: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 0,
      description:
        'Page number to fetch (0 = first page, 1 = second page, ...). Outseta uses page-based pagination, not record-based.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const params: string[] = [
      `limit=${context.propsValue.limit ?? 100}`,
      `offset=${context.propsValue.offset ?? 0}`,
    ];
    if (context.propsValue.fromPersonUid) {
      params.push(`FromPerson.Uid=${encodeURIComponent(context.propsValue.fromPersonUid)}`);
    }
    if (context.propsValue.fromPersonEmail) {
      params.push(
        `FromPerson.Email=${encodeURIComponent(context.propsValue.fromPersonEmail)}`
      );
    }

    return client.get<unknown>(`/api/v1/support/cases?${params.join('&')}`);
  },
});
