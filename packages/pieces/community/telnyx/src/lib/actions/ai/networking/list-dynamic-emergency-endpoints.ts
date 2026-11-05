import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListDynamicEmergencyEndpointsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_dynamic_emergency_endpoints',
	displayName: 'List Dynamic Emergency Endpoints',
	description: 'Lists dynamic E911 endpoints.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of dynamic emergency (E911) endpoints with callback number, caller name, linked emergency address and activation status. Read-only.',
		idempotent: true,
	},
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only endpoints in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Pending', value: 'pending' },
					{ label: 'Activated', value: 'activated' },
					{ label: 'Rejected', value: 'rejected' },
				],
			},
		}),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'Only endpoints in this ISO country code, e.g. "US".',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listDynamicEmergencyEndpoints({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: { status: p.status, country_code: p.countryCode },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
