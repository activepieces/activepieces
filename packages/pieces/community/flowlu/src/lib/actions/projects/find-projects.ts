import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluFind, flowluInput, flowluSharedProps } from '../../common/utils';
import { projectListOutputSchema } from '../../output-schemas';

export const findProjectsAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_find_projects',
  classification: 'SEARCH',
  displayName: 'Find Projects',
  description: 'Searches projects.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Flowlu projects by text and optional filters for manager and customer organization, skipping archived projects unless include_archived is set, and returns one page with has_more for paging. Use to find a project ID before reading or updating it or adding tasks to it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: flowluSharedProps.search(
      'Text to look for in project names and other text fields. Leave empty to list all.'
    ),
    manager_id: Property.ShortText({
      displayName: 'Manager User ID',
      description:
        'Only projects managed by this user. Numeric user ID from List Users.',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer Organization ID',
      description:
        'Only projects for this CRM organization. Numeric ID from Find CRM Accounts.',
      required: false,
    }),
    include_archived: Property.Checkbox({
      displayName: 'Include Archived',
      description: 'Also return archived projects.',
      required: false,
      defaultValue: false,
    }),
    order: flowluSharedProps.order(),
    page: flowluSharedProps.page(),
    limit: flowluSharedProps.limit(),
  },
  outputSchema: projectListOutputSchema,
  async run(context) {
    const props = context.propsValue;
    return flowluFind.run({
      client: makeClient(context.auth),
      module: 'st',
      entity: 'projects',
      props,
      filters: {
        'filter[manager_id]': flowluInput.optionalId({
          value: props.manager_id,
          name: 'Manager User ID',
        }),
        'filter[customer_id]': flowluInput.optionalId({
          value: props.customer_id,
          name: 'Customer Organization ID',
        }),
        'filter[is_archive]': props.include_archived ? undefined : 0,
      },
    });
  },
});
