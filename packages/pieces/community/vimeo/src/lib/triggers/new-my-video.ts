import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, { include_status?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS, propsValue }) => {
        try {
            const queryParams: Record<string, string> = {
                per_page: '50',
                sort: 'date',
                direction: 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,status,privacy,user,pictures,tags,stats,upload'
            };

            const response = await vimeoCommon.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: '/me/videos',
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch my videos: ${response.body?.error || 'Unknown error'}`);
            }

            const myVideos = response.body?.data || [];
            const { include_status } = propsValue;
            
            return myVideos
                .filter((video: any) => {
                    // Filter by status if specified
                    const statusFilter = include_status || 'available';
                    if (statusFilter !== 'all' && video.status !== 'available') {
                        return false;
                    }
                    
                    // Filter by creation time (videos created after last fetch)
                    const videoCreatedTime = new Date(video.created_time).getTime();
                    return videoCreatedTime > lastFetchEpochMS;
                })
                .map((video: any) => ({
                    epochMilliSeconds: new Date(video.created_time).getTime(),
                    data: {
                        ...video,
                        trigger_detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        is_processing: video.status !== 'available'
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
            
            throw new Error(`Failed to fetch my videos: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

export const newMyVideo = createTrigger({
    name: 'new_my_video',
    displayName: 'New Video of Mine',
    description: 'Triggers when you upload a video',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        include_status: Property.StaticDropdown({
            displayName: 'Video Status',
            description: 'Include videos based on processing status',
            required: false,
            defaultValue: 'available',
            options: {
                options: [
                    { label: 'Available only - Fully processed', value: 'available' },
                    { label: 'All videos - Including processing', value: 'all' }
                ]
            }
        }),
    },
    sampleData: {
        uri: '/videos/258684937',
        name: 'My New Video Upload',
        description: 'This is my latest video upload',
        type: 'video',
        link: 'https://vimeo.com/258684937',
        duration: 240,
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
            name: 'My Account',
            link: 'https://vimeo.com/myaccount',
            account: 'advanced'
        },
        pictures: [],
        tags: [
            {
                canonical: 'personal',
                name: 'personal',
                resource_key: 'bac1033deba2310ebba2caec33c23e4beea67aba',
                uri: '/videos/258684937/tags/personal'
            }
        ],
        stats: {
            plays: 0
        },
        upload: {
            status: 'complete',
            approach: 'pull'
        },
        trigger_detected_at: '2023-07-27T10:00:00+00:00',
        video_id: '258684937',
        is_processing: false
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
