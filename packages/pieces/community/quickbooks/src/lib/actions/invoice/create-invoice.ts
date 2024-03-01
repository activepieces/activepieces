// import { quickBooksAuth } from '@activepieces/piece-quickbooks';
// import { Property, createAction } from '@activepieces/pieces-framework';
// import { quickBooksCommon } from '../../common';

// export const createInvoiceAction = createAction({
// 	auth: quickBooksAuth,
// 	name: 'quickbooks_create_invoice',
// 	displayName: 'Create Invoice',
// 	description: 'Adds a new invoice(with line item support).',
// 	props: {
// 		customerId: quickBooksCommon.customerId(true, 'Customer'),
// 		lineItems: Property.Array({
// 			displayName: 'Line Items',
// 			required: true,
// 			properties: {
// 				ServiceDate: Property.ShortText({
// 					displayName: 'Service Date',
// 					required: false,
// 				}),
// 			},
// 		}),
// 	},
// 	async run(context) {
// 		customerId: quickBooksCommon.customerId;
// 	},
// });
