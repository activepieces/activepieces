import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const newMyVideo = createTrigger({
    name: 'new_my_video',
    displayName: 'New Video of Mine',
    description: 'Triggers when you add/upload a new video to your account',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        include_status: Property.StaticDropdown({
            displayName: 'Include Video Status',
            description: 'Which videos to include based on their processing status',
            required: false,
            defaultValue: 'available',
            options: {
                options: [
                    { label: 'Available only - Fully processed videos', value: 'available' },
                    { label: 'All videos - Including processing/uploading', value: 'all' }
                ]
            }
        }),
    },
    sampleData: {
        uri: '/videos/123456789',
        name: 'My New Video Upload',
        description: 'This is my latest video upload',
        type: 'video',
        link: 'https://vimeo.com/123456789',
        duration: 240,
        width: 1920,
        height: 1080,
        language: 'en',
        created_time: '2023-07-27T10:00:00+00:00',
        modified_time: '2023-07-27T10:00:00+00:00',
        release_time: '2023-07-27T10:00:00+00:00',
        content_rating: ['safe'],
        privacy: {
            view: 'anybody',
            embed: 'public',
            download: false,
            add: true,
            comments: 'anybody'
        },
        user: {
            uri: '/users/me',
            name: 'My Account',
            link: 'https://vimeo.com/myaccount'
        },
        pictures: {
            uri: '/videos/123456789/pictures/987654321',
            active: true,
            type: 'custom'
        },
        tags: [
            {
                uri: '/tags/personal',
                name: 'personal',
                tag: 'personal'
            }
        ],
        stats: {
            plays: 0,
            likes: 0,
            comments: 0
        },
        status: 'available',
        upload: {
            status: 'complete',
            approach: 'pull'
        }
    },
    
    onEnable: async (context) => {
        await context.store?.put('_trigger_last_run', Date.now());
    },
    
    onDisable: async (context) => {
        await context.store?.delete('_trigger_last_run');
    },
    
    run: async (context) => {
        const { include_status } = context.propsValue;
        const lastRunTime = await context.store?.get('_trigger_last_run') as number || 0;
        const currentTime = Date.now();
        
        try {
            const queryParams: Record<string, string> = {
                per_page: '50',
                sort: 'date',
                direction: 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,status,privacy,user,pictures,tags,stats,upload'
            };

            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/me/videos',
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch my videos: ${response.body?.error || 'Unknown error'}`);
            }

            const myVideos = response.body?.data || [];
            const newVideos = [];

            for (const video of myVideos) {
                const videoCreatedTime = new Date(video.created_time).getTime();
                
                if (videoCreatedTime > lastRunTime) {
                    const statusFilter = include_status || 'available';
                    
                    if (statusFilter === 'all' || video.status === 'available') {
                        newVideos.push({
                            ...video,
                            trigger_detected_at: new Date().toISOString(),
                            video_id: video.uri?.split('/').pop(),
                            is_processing: video.status !== 'available'
                        });
                    }
                } else {
                    break;
                }
            }

            if (newVideos.length > 0) {
                await context.store?.put('_trigger_last_run', currentTime);
            }
            
            return newVideos;
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
            }

            if (error.response?.status === 401) {
                throw new Error('Authentication error: Please check your Vimeo access token and ensure it has the necessary scopes.');
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: Your access token may not have the required permissions to access your videos.');
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests to the Vimeo API.');
            }
            
            throw new Error(`Failed to fetch my videos: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
