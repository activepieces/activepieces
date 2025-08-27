import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const newUserVideo = createTrigger({
    name: 'new_user_video',
    displayName: 'New Video by User',
    description: 'Triggers when another specified user adds a video',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        user_id: Property.ShortText({
            displayName: 'User ID or Username',
            description: 'The Vimeo user ID (numeric) or username to monitor for new videos',
            required: true,
        }),
        filter: Property.StaticDropdown({
            displayName: 'Video Filter',
            description: 'Filter videos by specific criteria',
            required: false,
            options: {
                options: [
                    { label: 'All videos', value: '' },
                    { label: 'App-only videos', value: 'app_only' },
                    { label: 'Embeddable videos', value: 'embeddable' },
                    { label: 'Featured videos', value: 'featured' },
                    { label: 'Live videos only', value: 'live' },
                    { label: 'No placeholder videos', value: 'no_placeholder' },
                    { label: 'No live videos', value: 'nolive' },
                    { label: 'Playable videos', value: 'playable' },
                    { label: 'Screen-recorded videos', value: 'screen_recorded' }
                ]
            }
        }),
        filter_embeddable: Property.Checkbox({
            displayName: 'Filter Embeddable',
            description: 'Filter by embeddable videos (requires filter to be set to embeddable)',
            required: false,
        }),
        filter_playable: Property.Checkbox({
            displayName: 'Filter Playable',
            description: 'Filter by playable videos',
            required: false,
        }),
        filter_tag: Property.ShortText({
            displayName: 'Filter by Tags (Any)',
            description: 'Comma-separated list of tags. Results must include at least one of these tags.',
            required: false,
        }),
        filter_tag_all_of: Property.ShortText({
            displayName: 'Filter by Tags (All)',
            description: 'Comma-separated list of tags. Results must include all of these tags.',
            required: false,
        }),
        sort: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'How to sort the videos',
            required: false,
            defaultValue: 'date',
            options: {
                options: [
                    { label: 'Date (newest first)', value: 'date' },
                    { label: 'Alphabetical by title', value: 'alphabetical' },
                    { label: 'Default sorting', value: 'default' },
                    { label: 'Duration', value: 'duration' },
                    { label: 'Last user interaction', value: 'last_user_action_event_date' },
                    { label: 'Number of likes', value: 'likes' },
                    { label: 'Last modification', value: 'modified_time' },
                    { label: 'Number of plays', value: 'plays' }
                ]
            }
        }),
        direction: Property.StaticDropdown({
            displayName: 'Sort Direction',
            description: 'Sort direction for the results',
            required: false,
            defaultValue: 'desc',
            options: {
                options: [
                    { label: 'Descending (newest/highest first)', value: 'desc' },
                    { label: 'Ascending (oldest/lowest first)', value: 'asc' }
                ]
            }
        }),
        max_videos_to_check: Property.Number({
            displayName: 'Max Videos to Check',
            description: 'Maximum number of recent videos to check for new uploads (1-100)',
            required: false,
            defaultValue: 50,
        }),
    },
    sampleData: {
        uri: '/videos/123456789',
        name: 'Partner\'s New Video',
        description: 'Latest upload from our partner account',
        type: 'video',
        link: 'https://vimeo.com/123456789',
        duration: 360,
        width: 1920,
        height: 1080,
        language: 'en',
        created_time: '2023-07-27T10:00:00+00:00',
        modified_time: '2023-07-27T10:00:00+00:00',
        release_time: '2023-07-27T10:00:00+00:00',
        content_rating: ['safe'],
        user: {
            uri: '/users/987654321',
            name: 'Partner Account',
            link: 'https://vimeo.com/partner'
        },
        pictures: {
            uri: '/videos/123456789/pictures/987654321',
            active: true,
            type: 'custom'
        },
        tags: [
            {
                uri: '/tags/partnership',
                name: 'partnership',
                tag: 'partnership'
            }
        ],
        stats: {
            plays: 500,
            likes: 25,
            comments: 8
        },
        privacy: {
            view: 'anybody',
            embed: 'public'
        }
    },
    
    onEnable: async (context) => {
        await context.store?.put('_trigger_last_run', Date.now());
    },
    
    onDisable: async (context) => {
        await context.store?.delete('_trigger_last_run');
    },
    
    run: async (context) => {
        const { 
            user_id, 
            filter, 
            filter_embeddable, 
            filter_playable, 
            filter_tag, 
            filter_tag_all_of, 
            sort, 
            direction, 
            max_videos_to_check 
        } = context.propsValue;
        
        const lastRunTime = await context.store?.get('_trigger_last_run') as number || 0;
        const currentTime = Date.now();
        
        if (!user_id || user_id.trim() === '') {
            throw new Error('User ID or username is required');
        }
        
        const perPage = Math.min(Math.max(max_videos_to_check || 50, 1), 100);
        
        try {
            const queryParams: Record<string, string> = {
                per_page: perPage.toString(),
                sort: sort || 'date',
                direction: direction || 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,user,pictures,tags,stats,privacy,status'
            };
            
            if (filter && filter.trim() !== '') {
                queryParams['filter'] = filter;
            }
            
            if (filter_embeddable !== undefined && filter === 'embeddable') {
                queryParams['filter_embeddable'] = filter_embeddable.toString();
            }
            
            if (filter_playable !== undefined) {
                queryParams['filter_playable'] = filter_playable.toString();
            }
            
            if (filter_tag && filter_tag.trim() !== '') {
                queryParams['filter_tag'] = filter_tag.trim();
            }
            
            if (filter_tag_all_of && filter_tag_all_of.trim() !== '') {
                queryParams['filter_tag_all_of'] = filter_tag_all_of.trim();
            }

            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/users/${user_id.trim()}/videos`,
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch videos for user ${user_id}: ${response.body?.error || 'Unknown error'}`);
            }

            const userVideos = response.body?.data || [];
            const newVideos = [];

            for (const video of userVideos) {
                const videoCreatedTime = new Date(video.created_time).getTime();
                if (videoCreatedTime > lastRunTime) {
                    newVideos.push({
                        ...video,
                        user_monitored: user_id,
                        detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        is_new_from_user: true
                    });
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
                throw new Error('Permission denied: You may not have permission to access this user\'s videos. Check if the videos are public or if you have the required permissions.');
            }

            if (error.response?.status === 404) {
                throw new Error(`User not found: The user "${user_id}" does not exist or their videos are not accessible.`);
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests to the Vimeo API.');
            }

            if (error.response?.status === 304) {
                return [];
            }
            
            throw new Error(`Failed to fetch videos for user ${user_id}: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
