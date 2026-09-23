import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { V2ListResponse, pipedriveAtomic } from '../common/atomic-helpers';
import { listDealProductsActionOutputSchema } from '../output-schemas';

export const listDealProductsAction = createAction({
	auth: pipedriveAuth,
	name: 'list-deal-products',
	outputSchema: listDealProductsActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Deal Products',
	description: 'Lists the products attached to a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one page of the product lines attached to a deal, with price, quantity and discount; pass next_cursor back as Cursor for the next page. Each row\'s id is the attachment ID that Remove Product From Deal needs, which differs from its product_id. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'The numeric deal ID (from Search Deals or List Deals).',
			required: true,
		}),
		sortBy: Property.StaticDropdown<string>({
			displayName: 'Sort By',
			description: 'Field to sort by. Defaults to ID.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'ID', value: 'id' },
					{ label: 'Add Time', value: 'add_time' },
					{ label: 'Update Time', value: 'update_time' },
					{ label: 'Order Number', value: 'order_nr' },
				],
			},
		}),
		sortDirection: pipedriveAtomic.sortDirectionProp(),
		...pipedriveAtomic.paginationProps(),
	},
	async run(context) {
		const props = context.propsValue;
		const response = await pipedriveAtomic.call<V2ListResponse<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v2/deals/${props.dealId}/products`,
			resourceLabel: `Deal ${props.dealId}`,
			query: {
				sort_by: props.sortBy,
				sort_direction: props.sortDirection,
				limit: pipedriveAtomic.clampLimit(props.limit),
				cursor: pipedriveAtomic.emptyToUndefined(props.cursor),
			},
		});
		return pipedriveAtomic.toPage(response);
	},
});
