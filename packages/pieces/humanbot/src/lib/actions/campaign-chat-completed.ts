import { createAction, PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const campaignChatCompletedAction = createAction({
    name: 'campaign_chat_completed_action', // Must be a unique across the piece, this shouldn't be changed.
    auth: PieceAuth.None(),
    displayName: 'Campaign Chat Completed',
    description: 'Triggers when the campaign chat is complete.',
    props: {
        // Properties to ask from the user, in this ask we will take number of
        campaign_embed_id: Property.ShortText({
            displayName: 'Campaign Embed ID',
            description: undefined,
            required: true,
        })
    },
    async run(context) {
        const HACKER_NEWS_API_URL = "https://hacker-news.firebaseio.com/v0/";
        const topStoryIdsResponse = await httpClient.sendRequest<string[]>({
            method: HttpMethod.GET,
            url: `${HACKER_NEWS_API_URL}topstories.json`
        });
        const topStoryIds: string[] = topStoryIdsResponse.body;
        const topStories: any[] = [];
        // for (let i = 0; i < Math.min(context.propsValue['number_of_stories']!, topStoryIds.length); i++) {
        //     const storyId = topStoryIds[i];
        //     const storyResponse = await httpClient.sendRequest({
        //         method: HttpMethod.GET,
        //         url: `${HACKER_NEWS_API_URL}item/${storyId}.json`
        //     });
        //     topStories.push(storyResponse.body);
        // }
        return topStories;
    },
});
