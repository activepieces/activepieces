import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const newVideoBySearch = createTrigger({
    name: 'new_video_by_search',
    displayName: 'New Video by Search',
    description: 'Triggers when a new video is added that matches a search query',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        search_query: Property.ShortText({
            displayName: 'Search Query',
            description: 'Keywords to search for in video titles and descriptions',
            required: true,
        }),
        filter: Property.StaticDropdown({
            displayName: 'Filter',
            description: 'Filter search results by specific criteria',
            required: false,
            options: {
                options: [
                    { label: 'All videos', value: '' },
                    { label: 'Creative Commons (any)', value: 'CC' },
                    { label: 'CC BY - Attribution only', value: 'CC-BY' },
                    { label: 'CC BY-NC - Attribution-NonCommercial', value: 'CC-BY-NC' },
                    { label: 'CC BY-NC-ND - Attribution-NonCommercial-NoDerivs', value: 'CC-BY-NC-ND' },
                    { label: 'CC BY-NC-SA - Attribution-NonCommercial-ShareAlike', value: 'CC-BY-NC-SA' },
                    { label: 'CC BY-ND - Attribution-NoDerivs', value: 'CC-BY-ND' },
                    { label: 'CC BY-SA - Attribution-ShareAlike', value: 'CC-BY-SA' },
                    { label: 'CC0 - Public Domain', value: 'CC0' },
                    { label: 'Filter by categories', value: 'categories' },
                    { label: 'Filter by duration', value: 'duration' },
                    { label: 'In-progress videos', value: 'in-progress' },
                    { label: 'Filter by minimum likes', value: 'minimum_likes' },
                    { label: 'Trending videos', value: 'trending' },
                    { label: 'Filter by upload date', value: 'upload_date' }
                ]
            }
        }),
        sort: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'How to sort the search results',
            required: false,
            defaultValue: 'date',
            options: {
                options: [
                    { label: 'Date (newest first)', value: 'date' },
                    { label: 'Relevance', value: 'relevant' },
                    { label: 'Alphabetical', value: 'alphabetical' },
                    { label: 'Comments', value: 'comments' },
                    { label: 'Duration', value: 'duration' },
                    { label: 'Likes', value: 'likes' },
                    { label: 'Plays', value: 'plays' }
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
            description: 'Maximum number of search results to check for new videos (1-100)',
            required: false,
            defaultValue: 50,
        }),
    },
    sampleData: {
        uri: '/videos/123456789',
        name: 'Conference Talk: Building APIs',
        description: 'A comprehensive talk about building scalable APIs',
        type: 'video',
        link: 'https://vimeo.com/123456789',
        duration: 1800,
        width: 1920,
        height: 1080,
        language: 'en',
        created_time: '2023-07-27T10:00:00+00:00',
        modified_time: '2023-07-27T10:00:00+00:00',
        release_time: '2023-07-27T10:00:00+00:00',
        content_rating: ['safe'],
        user: {
            uri: '/users/987654321',
            name: 'Tech Conference',
            link: 'https://vimeo.com/techconference'
        },
        pictures: {
            uri: '/videos/123456789/pictures/987654321',
            active: true,
            type: 'custom'
        },
        tags: [
            {
                uri: '/tags/conference',
                name: 'conference',
                tag: 'conference'
            }
        ],
        stats: {
            plays: 2500,
            likes: 150,
            comments: 45
        }
    },
    
    onEnable: async (context) => {
        await context.store?.put('_trigger_last_run', Date.now());
    },
    
    onDisable: async (context) => {
        await context.store?.delete('_trigger_last_run');
    },
    
    run: async (context) => {
        const { search_query, filter, sort, direction, max_videos_to_check } = context.propsValue;
        const lastRunTime = await context.store?.get('_trigger_last_run') as number || 0;
        const currentTime = Date.now();
        
        if (!search_query || search_query.trim() === '') {
            throw new Error('Search query is required and cannot be empty');
        }
        
        const perPage = Math.min(Math.max(max_videos_to_check || 50, 1), 100);
        
        try {
            const queryParams: Record<string, string> = {
                query: search_query.trim(),
                per_page: perPage.toString(),
                sort: sort || 'date',
                direction: direction || 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,user,pictures,tags,stats,privacy'
            };
            
            if (filter && filter.trim() !== '') {
                queryParams['filter'] = filter;
            }

            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/videos',
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to search videos: ${response.body?.error || 'Unknown error'}`);
            }

            const searchResults = response.body?.data || [];
            const newVideos = [];

            for (const video of searchResults) {
                const videoCreatedTime = new Date(video.created_time).getTime();
                if (videoCreatedTime > lastRunTime) {
                    newVideos.push({
                        ...video,
                        search_detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        search_query: search_query,
                        matched_by_search: true
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
                
                switch (errorCode) {
                    case 2101:
                        throw new Error(`Invalid parameters: ${errorMessage}. Cannot use filtering or sorting with URIs or links parameters.`);
                    case 2204:
                        throw new Error(`Batch request problem: ${errorMessage}. Please check your search parameters.`);
                    case 5451:
                        throw new Error(`Region restriction: ${errorMessage}. This search resource is restricted in your region.`);
                    case 7300:
                        throw new Error(`Internal search error: ${errorMessage}. Please try again later.`);
                    default:
                        throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
                }
            }

            if (error.response?.status === 401) {
                throw new Error('Authentication error: Please check your Vimeo access token and ensure it has the necessary scopes.');
            }

            if (error.response?.status === 404) {
                throw new Error('Search resource not found or restricted in your region.');
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests to the Vimeo API.');
            }

            if (error.response?.status === 503) {
                throw new Error('Search service unavailable: Video search is temporarily disabled. Please try again later.');
            }
            
            throw new Error(`Video search failed: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
