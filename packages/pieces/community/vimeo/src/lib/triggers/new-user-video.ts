import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, { user_id?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS, propsValue }) => {
        const { user_id } = propsValue;
        
        if (!user_id || user_id.trim() === '') {
            throw new Error('User ID or username is required');
        }
        
        try {
            const queryParams: Record<string, string> = {
                per_page: '50',
                sort: 'date',
                direction: 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,user,pictures,tags,stats,privacy,status'
            };

            const response = await vimeoCommon.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: `/users/${user_id.trim()}/videos`,
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch videos for user ${user_id}: ${response.body?.error || 'Unknown error'}`);
            }

            const userVideos = response.body?.data || [];
            
            return userVideos
                .filter((video: any) => {
                    const videoCreatedTime = new Date(video.created_time).getTime();
                    return videoCreatedTime > lastFetchEpochMS;
                })
                .map((video: any) => ({
                    epochMilliSeconds: new Date(video.created_time).getTime(),
                    data: {
                        ...video,
                        user_monitored: user_id,
                        detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        is_new_from_user: true
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
                throw new Error('Permission denied: You may not have permission to access this user\'s videos.');
            }

            if (error.response?.status === 404) {
                throw new Error(`User "${user_id}" not found or their videos are not accessible.`);
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests.');
            }
            
            throw new Error(`Failed to fetch videos for user ${user_id}: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

export const newUserVideo = createTrigger({
    name: 'new_user_video',
    displayName: 'New Video by User',
    description: 'Triggers when a user uploads a video',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        user_id: Property.ShortText({
            displayName: 'User ID or Username',
            description: 'Vimeo user ID or username to monitor',
            required: true,
        }),
    },
    sampleData: {
        uri: '/videos/258684937',
        name: 'Partner\'s New Video',
        description: 'Latest upload from our partner account',
        type: 'video',
        link: 'https://vimeo.com/258684937',
        duration: 360,
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
            name: 'Partner Account',
            link: 'https://vimeo.com/partner',
            account: 'advanced'
        },
        pictures: [],
        tags: [
            {
                canonical: 'partnership',
                name: 'partnership',
                resource_key: 'bac1033deba2310ebba2caec33c23e4beea67aba',
                uri: '/videos/258684937/tags/partnership'
            }
        ],
        stats: {
            plays: 500
        },
        user_monitored: 'partneraccount',
        detected_at: '2023-07-27T10:00:00+00:00',
        video_id: '258684937',
        is_new_from_user: true
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
