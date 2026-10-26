import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListFaxesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_faxes',
	displayName: 'List Faxes',
	description: 'Lists sent and received faxes.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of faxes with their id, direction, numbers, status and media. Filter by direction, numbers or creation time.',
		idempotent: true,
	},
	props: {
		direction: Property.StaticDropdown({
			displayName: 'Direction',
			description: 'Only return inbound or outbound faxes.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Inbound', value: 'inbound' },
					{ label: 'Outbound', value: 'outbound' },
				],
			},
		}),
		from: Property.ShortText({
			displayName: 'From',
			description: 'Only return faxes sent from this number (E.164).',
			required: false,
		}),
		to: Property.ShortText({
			displayName: 'To',
			description: 'Only return faxes sent to this number (E.164).',
			required: false,
		}),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Only return faxes created at or after this time.',
			required: false,
		}),
		createdBefore: Property.DateTime({
			displayName: 'Created Before',
			description: 'Only return faxes created at or before this time.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listFaxes({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: {
						'filter[direction][eq]': p.direction,
						'filter[from][eq]': p.from,
						'filter[to][eq]': p.to,
						'filter[created_at][gte]': p.createdAfter,
						'filter[created_at][lte]': p.createdBefore,
					},
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
