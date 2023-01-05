import {createAction} from '../../../framework/action/action';
import {HttpMethod} from '../../../common/http/core/http-method';
import {httpClient} from '../../../common/http/core/http-client';
import {Property} from "../../../framework/property/prop.model";

export const fetchTopStories = createAction({
	name: 'fetch_top_stories', // Must be a unique across the piece, this shouldn't be changed.
    displayName:'Fetch Top Stories',
    description: 'Fetch top stories from hackernews',
	props: {
        // Properties to ask from the user, in this ask we will take number of
		number_of_stories: Property.Number({
			displayName: 'Number of Stories',
			description: undefined,
			required: true,
		})
	},
	async run(configValue) {
        const HACKER_NEWS_API_URL = "https://hacker-news.firebaseio.com/v0/";
        const topStoryIdsResponse = await httpClient.sendRequest<string[]>({
			method: HttpMethod.GET,
			url: `${HACKER_NEWS_API_URL}topstories.json`
		});
        const topStoryIds: string[] = topStoryIdsResponse;
        const topStories = [];
        for (let i = 0; i < Math.min(configValue.propsValue['number_of_stories']!, topStoryIds.length); i++) {
          const storyId = topStoryIds[i];
          const storyResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${HACKER_NEWS_API_URL}item/${storyId}.json`
          });
          topStories.push(storyResponse);
        }
		return topStories;
	},
});


