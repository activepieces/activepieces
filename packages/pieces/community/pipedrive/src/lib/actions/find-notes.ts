import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {  pipedrivePaginatedV1ApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const findNotesAction = createAction({
    auth: pipedriveAuth,
    name: 'find-notes',
    displayName: 'Find Notes',
    description: 'Finds notes by Deal, Lead, Person, or Organization ID.', 
    props: {
        objectType: Property.StaticDropdown({
            displayName: 'Search By',
            required: true,
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Deal',
                        value: 'deal_id',
                    },
                    {
                        label: 'Lead',
                        value: 'lead_id',
                    },
                    {
                        label: 'Person',
                        value: 'person_id',
                    },
                    {
                        label: 'Organization',
                        value: 'org_id',
                    },
                ],
            },
        }),
        objectId: Property.ShortText({ 
            displayName: 'ID',
            required: true,
        }),
    },
    async run(context) {
		const response = await pipedrivePaginatedV1ApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/v1/notes`,
			query: {
				sort: 'update_time DESC',
				[context.propsValue.objectType]:context.propsValue.objectId
			},
		});

		if (isNil(response) || response.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		return {
			found: response.length > 0,
			data: response,
		};
	},
});
