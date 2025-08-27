import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const newLikedVideo = createTrigger({
    name: 'new_liked_video',
    displayName: 'New Video I\'ve Liked',
    description: 'Triggers when you like a new video on Vimeo',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        max_videos_to_check: Property.Number({
            displayName: 'Max Videos to Check',
            description: 'Maximum number of recent liked videos to check for new likes (1-100)',
            required: false,
            defaultValue: 50,
        }),
    },
    sampleData: {
        uri: '/videos/123456789',
        name: 'Sample Video Title',
        description: 'This is a sample video description',
        type: 'video',
        link: 'https://vimeo.com/123456789',
        duration: 180,
        width: 1920,
        height: 1080,
        language: 'en',
        created_time: '2023-07-27T10:00:00+00:00',
        modified_time: '2023-07-27T10:00:00+00:00',
        release_time: '2023-07-27T10:00:00+00:00',
        content_rating: ['safe'],
        user: {
            uri: '/users/987654321',
            name: 'Video Creator',
            link: 'https://vimeo.com/user987654321'
        },
        pictures: {
            uri: '/videos/123456789/pictures/987654321',
            active: true,
            type: 'custom'
        },
        tags: [
            {
                uri: '/tags/inspiration',
                name: 'inspiration',
                tag: 'inspiration'
            }
        ],
        stats: {
            plays: 1500,
            likes: 75,
            comments: 12
        }
    },
    
    onEnable: async (context) => {
        await context.store?.put('_known_liked_videos', []);
    },
    
    onDisable: async (context) => {
        await context.store?.delete('_known_liked_videos');
    },
    
    run: async (context) => {
        const { max_videos_to_check } = context.propsValue;
        const knownLikedVideos = await context.store?.get('_known_liked_videos') as string[] || [];
        
        const perPage = Math.min(Math.max(max_videos_to_check || 50, 1), 100);
        
        try {
            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/me/likes',
                query: {
                    per_page: perPage.toString(),
                    sort: 'date',
                    direction: 'desc',
                    fields: 'uri,name,description,link,duration,created_time,modified_time,user,pictures,tags,stats,privacy'
                }
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch liked videos: ${response.body?.error || 'Unknown error'}`);
            }

            const likedVideos = response.body?.data || [];
            const newLikedVideos = [];
            const currentLikedVideoUris = [];

            for (const video of likedVideos) {
                currentLikedVideoUris.push(video.uri);
                
                if (!knownLikedVideos.includes(video.uri)) {
                    newLikedVideos.push({
                        ...video,
                        liked_detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        is_new_like: true
                    });
                }
            }

            await context.store?.put('_known_liked_videos', currentLikedVideoUris);
            
            return newLikedVideos;
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
            }

            if (error.response?.status === 401) {
                throw new Error('Authentication error: Please check your Vimeo access token and ensure it has the necessary scopes to access your liked videos.');
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: Your access token may not have the required permissions to access your liked videos.');
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests to the Vimeo API.');
            }
            
            throw new Error(`Failed to fetch liked videos: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
