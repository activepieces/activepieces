import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, {}> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, lastItemId }) => {
        try {
            const response = await vimeoCommon.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: '/me/likes',
                query: {
                    per_page: '50',
                    sort: 'date',
                    direction: 'desc',
                    fields: 'uri,name,description,link,duration,created_time,modified_time,user,pictures,tags,stats,privacy'
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch liked videos: ${response.body?.error || 'Unknown error'}`);
            }

            const likedVideos = response.body?.data || [];
            
            return likedVideos.map((video: any) => ({
                id: video.uri, // Use video URI as unique identifier
                data: {
                    ...video,
                    liked_detected_at: new Date().toISOString(),
                    video_id: video.uri?.split('/').pop(),
                    is_new_like: true
                }
            }));
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
            }

            if (error.response?.status === 401) {
                throw new Error('Authentication error: Please check your Vimeo access token.');
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: Your access token may not have the required permissions.');
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests.');
            }
            
            throw new Error(`Failed to fetch liked videos: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

export const newLikedVideo = createTrigger({
    name: 'new_liked_video',
    displayName: 'New Video I\'ve Liked',
    description: 'Triggers when you like a video',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {
        uri: '/videos/258684937',
        name: 'Celebrating 10 Years of Staff Picks',
        description: 'A celebration of 10 years of Staff Picks.',
        type: 'video',
        link: 'https://vimeo.com/258684937',
        duration: 81,
        width: 1920,
        height: 1080,
        language: 'en-US',
        created_time: '2018-03-05T21:04:47+00:00',
        modified_time: '2018-09-16T09:02:40+00:00',
        release_time: '2018-03-05T21:04:47+00:00',
        content_rating: [],
        content_rating_class: 'explicit',
        resource_key: 'bac1033deba2310ebba2caec33c23e4beea67aba',
        status: 'available',
        license: 'by',
        privacy: {
            add: true,
            comments: 'anybody',
            download: true,
            embed: 'private',
            view: 'anybody'
        },
        user: {
            uri: '/users/152184',
            name: 'Vimeo Staff',
            link: 'https://vimeo.com/staff',
            account: 'advanced',
            bio: 'This is where you will find videos and news updates from the staff.',
            location: 'New York City'
        },
        pictures: [],
        tags: [
            {
                canonical: 'awesome',
                name: 'awesome',
                resource_key: 'bac1033deba2310ebba2caec33c23e4beea67aba',
                uri: '/videos/258684937/tags/awesome'
            }
        ],
        stats: {
            plays: 20
        },
        metadata: {
            interactions: {
                like: {
                    added: true,
                    uri: '/videos/258684937/likes'
                }
            }
        },
        liked_detected_at: '2023-07-27T10:00:00+00:00',
        video_id: '258684937',
        is_new_like: true
    },
    
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
});
