import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const deleteVideo = createAction({
    name: 'delete_video',
    displayName: 'Delete Video(s)',
    description: 'Permanently delete one or more videos from your account',
    auth: vimeoAuth,
    props: {
        deletion_method: Property.StaticDropdown({
            displayName: 'Deletion Method',
            description: 'Choose whether to delete a single video or multiple videos',
            required: true,
            defaultValue: 'single',
            options: {
                options: [
                    { label: 'Delete Single Video', value: 'single' },
                    { label: 'Delete Multiple Videos', value: 'multiple' }
                ]
            }
        }),
        video_id: Property.ShortText({
            displayName: 'Video ID',
            description: 'The ID of the video to delete (e.g., 123456789)',
            required: false,
        }),
        video_uris: Property.LongText({
            displayName: 'Video URIs',
            description: 'Comma-separated list of video URIs to delete (e.g., /videos/123456789,/videos/987654321)',
            required: false,
        }),
        confirm_deletion: Property.Checkbox({
            displayName: 'Confirm Deletion',
            description: 'Check this box to confirm you want to permanently delete the video(s)',
            required: true,
        }),
    },
    async run(context) {
        const { deletion_method, video_id, video_uris, confirm_deletion } = context.propsValue;

        if (!confirm_deletion) {
            throw new Error('You must confirm the deletion by checking the confirmation checkbox');
        }

        const method = deletion_method || 'single';

        if (method === 'single' && !video_id) {
            throw new Error('Video ID is required for single video deletion');
        }

        if (method === 'multiple' && !video_uris) {
            throw new Error('Video URIs are required for multiple video deletion');
        }

        try {
            let response;
            let deletedItems;

            if (method === 'single') {
                response = await vimeoCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.DELETE,
                    resourceUri: `/videos/${video_id}`,
                });
                deletedItems = [video_id];
            } else {
                const urisParam = video_uris?.trim();
                if (!urisParam) {
                    throw new Error('Video URIs cannot be empty');
                }

                response = await vimeoCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.DELETE,
                    resourceUri: '/me/videos',
                    query: {
                        uris: urisParam
                    }
                });
                deletedItems = urisParam.split(',').map(uri => uri.trim());
            }

            if (response.status === 204) {
                return {
                    success: true,
                    deletion_method: method,
                    deleted_videos: deletedItems,
                    message: method === 'single' 
                        ? `Video ${video_id} has been permanently deleted`
                        : `${deletedItems.length} video(s) have been permanently deleted`
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
                        throw new Error(`Invalid input: ${errorMessage}. Please check your video ID or URIs.`);
                    case 3200:
                        throw new Error(`Permission denied: ${errorMessage}. You can only delete videos you own.`);
                    case 5000:
                        throw new Error(`Video not found: ${errorMessage}. The specified video does not exist.`);
                    case 8000:
                        throw new Error(`Authentication error: ${errorMessage}. Please check your credentials.`);
                    default:
                        throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
                }
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: You can only delete videos that you own.');
            }

            if (error.response?.status === 404) {
                throw new Error('Video not found: The specified video does not exist or has already been deleted.');
            }
            
            throw new Error(`Delete failed: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
