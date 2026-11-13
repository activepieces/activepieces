import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { addCommentAction } from './lib/actions/add-comment';
import { addCustomersToServiceDeskAction } from './lib/actions/add-customers-to-service-desk';
import { addOrganizationToServiceDeskAction } from './lib/actions/add-organization-to-service-desk';
import { addRequestParticipantsAction } from './lib/actions/add-request-participants';
import { answerApprovalAction } from './lib/actions/answer-approval';
import { createCustomerAction } from './lib/actions/create-customer';
import { createOrganizationAction } from './lib/actions/create-organization';
import { createRequestAction } from './lib/actions/create-request';
import { findRequestsAction } from './lib/actions/find-requests';
import { getRequestAction } from './lib/actions/get-request';
import { listQueueRequestsAction } from './lib/actions/list-queue-requests';
import { transitionRequestAction } from './lib/actions/transition-request';
import { jsmAuth } from './lib/auth';
import { jsmClient } from './lib/common/client';
import { newRequestTrigger } from './lib/triggers/new-request';

export const jiraServiceManagement = createPiece({
	displayName: 'Jira Service Management',
	description:
		'Service desk for IT and support teams: customer requests, comments, approvals, customers and queues. Works with Jira Cloud and Jira Data Center.',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
	categories: [PieceCategory.CUSTOMER_SUPPORT],
	auth: jsmAuth,
	authors: ['ibrahim-abuznaid'],
	actions: [
		createRequestAction,
		getRequestAction,
		findRequestsAction,
		addCommentAction,
		transitionRequestAction,
		answerApprovalAction,
		addRequestParticipantsAction,
		createCustomerAction,
		addCustomersToServiceDeskAction,
		createOrganizationAction,
		addOrganizationToServiceDeskAction,
		listQueueRequestsAction,
		createCustomApiCallAction({
			auth: jsmAuth,
			baseUrl: (auth) => (auth ? `${jsmClient.instanceUrl(auth.props)}/rest/servicedeskapi` : ''),
			authMapping: async (auth) => jsmClient.authHeaders(auth.props),
			props: {
				url: {
					description: "Full URL, or a path relative to your site's /rest/servicedeskapi.",
					placeholder: '/request/SD-123',
				},
			},
		}),
	],
	triggers: [newRequestTrigger],
});
