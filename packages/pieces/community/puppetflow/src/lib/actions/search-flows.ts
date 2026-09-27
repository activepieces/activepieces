import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { PuppetflowFlow, puppetflowRequest } from '../common/client';
import { credentialsOf } from '../common/props';

export const searchFlowsAction = createAction({
  auth: puppetflowAuth,
  name: 'search_flows',
  displayName: 'Search Flows',
  description: 'Find flows by name, description, ID, or type',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the Puppetflow flows accessible to the connected API key. Use it to discover a flow ID before triggering a flow or listing its runs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text matched against the flow name, description, or ID',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filter by exact flow name',
      required: false,
    }),
    flowType: Property.StaticDropdown({
      displayName: 'Flow Type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Code', value: 'code' },
          { label: 'Nodal', value: 'nodal' },
        ],
      },
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Only return flows in this folder (fld_...)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of flows to return, from 1 to 100',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { search, name, flowType, folderId, limit } = context.propsValue;
    return puppetflowRequest<PuppetflowFlow[]>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: '/flows',
      query: {
        search,
        name,
        type: flowType,
        folder_id: folderId,
        limit: limit ?? 50,
      },
    });
  },
});
