import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomerAction } from './lib/actions/customer/create-customer';
import { updateCustomerAction } from './lib/actions/customer/update-customer';

export const quickBooksAuth = PieceAuth.OAuth2({
	required: true,
	description: 'You can find Company ID under **settings->Additional Info**.',
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			required: true,
		}),
	},
	scope: ['com.intuit.quickbooks.accounting'],
	authUrl: 'https://appcenter.intuit.com/connect/oauth2',
	tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
});

export const quickbooks = createPiece({
	displayName: 'QuickBooks',
	auth: quickBooksAuth,
	minimumSupportedRelease: '0.20.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
	categories: [PieceCategory.ACCOUNTING],
	authors: ['kishanprmr'],
	actions: [createCustomerAction, updateCustomerAction],
	triggers: [],
});
