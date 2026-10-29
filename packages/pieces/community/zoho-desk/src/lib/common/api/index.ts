import { zohoDeskAccountsApi } from './accounts';
import { zohoDeskActivitiesApi } from './activities';
import { zohoDeskContactsApi } from './contacts';
import { zohoDeskContractsApi } from './contracts';
import { zohoDeskHelpCenterUsersApi } from './help-center-users';
import { zohoDeskKnowledgeBaseApi } from './knowledge-base';
import { zohoDeskOrganizationApi } from './organization';
import { zohoDeskProductsApi } from './products';
import { zohoDeskTasksApi } from './tasks';
import { zohoDeskThreadsApi } from './threads';
import { zohoDeskTicketCommentsApi } from './ticket-comments';
import { zohoDeskTicketsApi } from './tickets';
import { zohoDeskTimeTrackingApi } from './time-tracking';

export const zohoDeskApi = {
	...zohoDeskTicketsApi,
	...zohoDeskThreadsApi,
	...zohoDeskTicketCommentsApi,
	...zohoDeskContactsApi,
	...zohoDeskAccountsApi,
	...zohoDeskTasksApi,
	...zohoDeskProductsApi,
	...zohoDeskKnowledgeBaseApi,
	...zohoDeskOrganizationApi,
	...zohoDeskTimeTrackingApi,
	...zohoDeskActivitiesApi,
	...zohoDeskContractsApi,
	...zohoDeskHelpCenterUsersApi,
};
