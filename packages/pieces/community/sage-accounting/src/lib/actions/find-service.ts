import { createAction, Property } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { findServiceActionOutputSchema } from '../output-schemas';

export const findServiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'find_service',
  classification: 'SEARCH',
  displayName: 'Find Service',
  description: 'Searches for services in Sage Accounting by description or item code.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Sage Accounting services by description or item code (partial match). Returns zero or more matches. Read-only, safe to retry.',
    idempotent: true,
  },
  outputSchema: findServiceActionOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Description or Item Code contains',
      required: false,
    }),
    active: Property.Checkbox({ displayName: 'Active only', required: false }),
    updatedOrCreatedSince: Property.DateTime({
      displayName: 'Updated or Created Since',
      description: 'Only return services changed since this date/time.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max results',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 200,
    }),
  },
  async run(context) {
    const { search, active, updatedOrCreatedSince, maxResults } = context.propsValue;
    const { items } = await sageAccountingClient.list<Record<string, unknown>>({
      accessToken: context.auth.access_token,
      path: sageAccountingClient.paths.services,
      query: {
        ...(search ? { search } : {}),
        ...(active !== undefined ? { active: String(active) } : {}),
        ...(updatedOrCreatedSince ? { updated_or_created_since: updatedOrCreatedSince } : {}),
        nested_attributes: 'all',
        items_per_page: String(maxResults ?? 10),
      },
    });

    return items;
  },
});
