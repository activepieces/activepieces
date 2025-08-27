import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const deleteVideo = createAction({
    name: 'delete_video',
    displayName: 'Delete Video',
    description: 'Permanently delete a video from your account',
    auth: vimeoAuth,
    props: {
        video: Property.DynamicProperties({
            displayName: 'Video',
            description: 'Select a video to delete',
            required: true,
            refreshers: [],
            props: async ({ auth }) => {
                if (!auth) {
                    return {
                        video_id: Property.ShortText({
                            displayName: 'Video ID',
                            description: 'Enter video ID manually',
                            required: true,
                        })
                    };
                }

                try {
                    const response = await vimeoCommon.apiCall({
                        auth,
                        method: HttpMethod.GET,
                        resourceUri: '/me/videos',
                        query: { 
                            per_page: '50',
                            sort: 'date',
                            direction: 'desc',
                            fields: 'uri,name,description,created_time'
                        }
                    });

                    const videos = response.body?.data || [];
                    const videoOptions = videos.map((video: any) => ({
                        label: `${video.name || 'Untitled'} (${video.uri?.split('/').pop()})`,
                        value: video.uri?.split('/').pop()
                    }));

                    if (videoOptions.length > 0) {
                        return {
                            video_id: Property.StaticDropdown({
                                displayName: 'Select Video',
                                description: 'Choose a video to delete',
                                required: true,
                                options: {
                                    options: videoOptions
                                }
                            })
                        };
                    } else {
                        return {
                            video_id: Property.ShortText({
                                displayName: 'Video ID',
                                description: 'No videos found. Enter video ID manually',
                                required: true,
                            })
                        };
                    }
                } catch (error) {
                    return {
                        video_id: Property.ShortText({
                            displayName: 'Video ID',
                            description: 'Enter video ID manually',
                            required: true,
                        })
                    };
                }
            }
        }),
        confirm_deletion: Property.Checkbox({
            displayName: 'Confirm Deletion',
            description: 'I understand this will permanently delete the video',
            required: true,
        }),
    },
    async run(context) {
        const { video, confirm_deletion } = context.propsValue;

        if (!confirm_deletion) {
            throw new Error('You must confirm the deletion by checking the confirmation checkbox');
        }

        // Extract dynamic property value
        const video_id = video?.['video_id'];

        if (!video_id) {
            throw new Error('Video ID is required');
        }

        try {
            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.DELETE,
                resourceUri: `/videos/${video_id}`,
            });

            if (response.status === 204) {
                return {
                    success: true,
                    video_id,
                    message: `Video has been permanently deleted`
                };
            } else {
                throw new Error(`Unexpected response status: ${response.status}. Expected 204 No Content.`);
            }
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                switch (errorCode) {
                    case 2204:
                        throw new Error(`Invalid video ID: Please check the video ID is correct.`);
                    case 3200:
                        throw new Error(`Permission denied: You can only delete videos you own.`);
                    case 5000:
                        throw new Error(`Video not found: The video does not exist.`);
                    case 8000:
                        throw new Error(`Authentication error: Please check your credentials.`);
                    default:
                        throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
                }
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: You can only delete videos you own.');
            }

            if (error.response?.status === 404) {
                throw new Error('Video not found: The video does not exist or has already been deleted.');
            }
            
            throw new Error(`Delete failed: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
