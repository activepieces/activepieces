import { createAction, Property } from '@activepieces/pieces-framework';
import { ListSecretsCommand } from '@aws-sdk/client-secrets-manager';
import { awsSecretsManagerAuth, createSecretsManagerClient } from '../common/auth';

export const findSecret = createAction({
  auth: awsSecretsManagerAuth,
  name: 'findSecret',
  displayName: 'Find Secret',
  description: 'Finds an existing secret using filters.',
  props: {
    filterKey: Property.StaticDropdown({
      displayName: 'Filter Key',
      description: 'The field to filter by',
      required: true,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Description', value: 'description' },
          { label: 'Tag Key', value: 'tag-key' },
          { label: 'Tag Value', value: 'tag-value' },
          { label: 'Primary Region', value: 'primary-region' },
          { label: 'Owning Service', value: 'owning-service' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    filterValue: Property.ShortText({
      displayName: 'Filter Value',
      description: 'The value to search for',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (1-100)',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort results by',
      required: false,
      options: {
        options: [
          { label: 'Created Date', value: 'created-date' },
          { label: 'Last Accessed Date', value: 'last-accessed-date' },
          { label: 'Last Changed Date', value: 'last-changed-date' },
          { label: 'Name', value: 'name' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order for results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = await createSecretsManagerClient(auth.props);
    const command = new ListSecretsCommand({
      Filters: [
        {
          Key: propsValue.filterKey as
            | 'description'
            | 'name'
            | 'tag-key'
            | 'tag-value'
            | 'primary-region'
            | 'owning-service'
            | 'all',
          Values: [propsValue.filterValue],
        },
      ],
      MaxResults: propsValue.maxResults,
      SortBy: propsValue.sortBy as 'created-date' | 'last-accessed-date' | 'last-changed-date' | 'name' | undefined,
      SortOrder: propsValue.sortOrder as 'asc' | 'desc' | undefined,
    });
    return client.send(command);
  },
});
