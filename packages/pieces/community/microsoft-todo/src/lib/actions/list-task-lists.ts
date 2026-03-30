00001| import { createAction } from '@activepieces/pieces-framework';
00002| import { microsoftToDoAuth } from '../auth';
00003| import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
00004| import { TodoTaskList } from '@microsoft/microsoft-graph-types';
00005| 
00006| export const listTaskListsAction = createAction({
00007| 	auth: microsoftToDoAuth,
00008| 	name: 'list_task_lists',
00009| 	displayName: 'List Task Lists',
00010| 	description: 'Returns a list of all task lists.',
00011| 	props: {},
00012| 	async run(context) {
00013| 		const { auth } = context;
00014| 		const client = Client.initWithMiddleware({
00015| 			authProvider: {
00016| 				getAccessToken: () => Promise.resolve(auth.access_token),
00017| 			},
00018| 		});
00019| 
00020| 		const result: TodoTaskList[] = [];
00021| 		let response: PageCollection = await client.api('/me/todo/lists').get();
00022| 
00023| 		while (response.value.length > 0) {
00024| 			for (const list of response.value as TodoTaskList[]) {
00025| 				result.push(list);
00026| 			}
00027| 			if (response['@odata.nextLink']) {
00028| 				response = await client.api(response['@odata.nextLink']).get();
00029| 			} else {
00030| 				break;
00031| 			}
00032| 		}
00033| 
00034| 		return result;
00035| 	},
00036| });
