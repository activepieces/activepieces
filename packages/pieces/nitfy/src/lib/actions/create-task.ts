import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { nitfyAuth } from "@activepieces/piece-nitfy";

export const createNewTask = createAction({
	name: 'Create a task', // Must be a unique across the piece, this shouldn't be changed.
    auth: nitfyAuth,
    displayName:'Fetch Top Stories',
    description: 'Fetch top stories from hackernews',
	props: {
        task_name: Property.ShortText({
            displayName : "Task name",
            description: "Enter the task name",
            required:true,
        })
	},
	async run(context) {
        // const HACKER_NEWS_API_URL = "https://hacker-news.firebaseio.com/v0/";
        // const topStoryIdsResponse = await httpClient.sendRequest<string[]>({
		// 	method: HttpMethod.GET,
		// 	url: `${HACKER_NEWS_API_URL}topstories.json`
		// });
        // const topStoryIds: string[] = topStoryIdsResponse.body;
		return [context.auth];
	},
});

