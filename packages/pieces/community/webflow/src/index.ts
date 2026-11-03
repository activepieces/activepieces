import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCollectionItemAction } from './lib/actions/create-collection-item';
import { deleteCollectionItemAction } from './lib/actions/delete-collection-item';
import { findCollectionItemAction } from './lib/actions/find-collection-item';
import { findOrderAction } from './lib/actions/find-order';
import { fulfillOrderAction } from './lib/actions/fulfill-order';
import { getCollectionItemAction } from './lib/actions/get-collection-item';
import { listCollectionsAction } from './lib/actions/list-collections';
import { listSitesAction } from './lib/actions/list-sites';
import { publishCollectionItemAction } from './lib/actions/publish-collection-item';
import { refundOrderAction } from './lib/actions/refund-order';
import { unfulfillOrderAction } from './lib/actions/unfulfill-order';
import { updateCollectionItemAction } from './lib/actions/update-collection-item';
import { webflowAiActions } from './lib/actions/ai';
import { webflowAuth } from './lib/auth';
import { webflowClient } from './lib/common/client';
import { formSubmittedTrigger } from './lib/triggers/form-submitted';

export const webflow = createPiece({
	displayName: 'Webflow',
	description: 'Design, build, and launch responsive websites visually',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/webflow.png',
	categories: [PieceCategory.MARKETING],
	authors: [
		'Angelebeats',
		'Ahmad-AbuOsbeh',
		'TaskMagicKyle',
		'kishanprmr',
		'MoShizzle',
		'khaledmashaly',
		'abuaboud',
	],
	auth: webflowAuth,
	actions: [
		createCollectionItemAction,
		deleteCollectionItemAction,
		updateCollectionItemAction,
		findCollectionItemAction,
		getCollectionItemAction,
		fulfillOrderAction,
		unfulfillOrderAction,
		refundOrderAction,
		findOrderAction,
		publishCollectionItemAction,
		listSitesAction,
		listCollectionsAction,
		...webflowAiActions,
		createCustomApiCallAction({
			baseUrl: () => webflowClient.baseUrl(),
			auth: webflowAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.access_token}`,
			}),
		}),
	],
	triggers: [formSubmittedTrigger],
});
