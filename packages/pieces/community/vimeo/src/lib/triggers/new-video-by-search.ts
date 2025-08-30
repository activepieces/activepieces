import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, { search_query?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS, propsValue }) => {
        const { search_query } = propsValue;
        
        if (!search_query || search_query.trim() === '') {
            throw new Error('Search query is required and cannot be empty');
        }
        
        try {
            const queryParams: Record<string, string> = {
                query: search_query.trim(),
                per_page: '50',
                sort: 'date',
                direction: 'desc',
                fields: 'uri,name,description,link,duration,created_time,modified_time,release_time,user,pictures,tags,stats,privacy'
            };

            const response = await vimeoCommon.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: '/videos',
                query: queryParams
            });

            if (response.status !== 200) {
                throw new Error(`Failed to search videos: ${response.body?.error || 'Unknown error'}`);
            }

            const searchResults = response.body?.data || [];
            
            return searchResults
                .filter((video: any) => {
                    const videoCreatedTime = new Date(video.created_time).getTime();
                    return videoCreatedTime > lastFetchEpochMS;
                })
                .map((video: any) => ({
                    epochMilliSeconds: new Date(video.created_time).getTime(),
                    data: {
                        ...video,
                        search_detected_at: new Date().toISOString(),
                        video_id: video.uri?.split('/').pop(),
                        search_query: search_query,
                        matched_by_search: true
                    }
                }));
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                switch (errorCode) {
                    case 2101:
                        throw new Error(`Invalid parameters: Cannot use filtering or sorting with URIs or links parameters.`);
                    case 2204:
                        throw new Error(`Batch request problem: Please check your search parameters.`);
                    case 5451:
                        throw new Error(`Region restriction: This search resource is restricted in your region.`);
                    case 7300:
                        throw new Error(`Internal search error: Please try again later.`);
                    default:
                        throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
                }
            }

            if (error.response?.status === 401) {
                throw new Error('Authentication error: Please check your Vimeo access token.');
            }

            if (error.response?.status === 404) {
                throw new Error('Search resource not found or restricted in your region.');
            }

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded: Please wait before making more requests.');
            }

            if (error.response?.status === 503) {
                throw new Error('Search service unavailable: Video search is temporarily disabled.');
            }
            
            throw new Error(`Video search failed: ${error.message || 'Unknown error occurred'}`);
        }
    }
};

export const newVideoBySearch = createTrigger({
    name: 'new_video_by_search',
    displayName: 'New Video by Search',
    description: 'Triggers when a video matching your search is uploaded',
    auth: vimeoAuth,
    type: TriggerStrategy.POLLING,
    props: {
        search_query: Property.ShortText({
            displayName: 'Search Query',
            description: 'Keywords to search for in video titles and descriptions',
            required: true,
        }),
    },
    sampleData: {
        uri: '/videos/258684937',
        name: 'Conference Talk: Building APIs',
        description: 'A comprehensive talk about building scalable APIs',
        type: 'video',
        link: 'https://vimeo.com/258684937',
        duration: 1800,
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
            name: 'Tech Conference',
            link: 'https://vimeo.com/techconference',
            account: 'advanced'
        },
        pictures: [],
        tags: [
            {
                canonical: 'conference',
                name: 'conference',
                resource_key: 'bac1033deba2310ebba2caec33c23e4beea67aba',
                uri: '/videos/258684937/tags/conference'
            }
        ],
        stats: {
            plays: 2500
        },
        search_detected_at: '2023-07-27T10:00:00+00:00',
        video_id: '258684937',
        search_query: 'building APIs',
        matched_by_search: true
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
