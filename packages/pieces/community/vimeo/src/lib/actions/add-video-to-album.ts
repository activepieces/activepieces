import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const addVideoToAlbum = createAction({
    name: 'add_video_to_album',
    displayName: 'Add Video to Album',
    description: 'Add an existing video to a user\'s album (also known as showcase)',
    auth: vimeoAuth,
    props: {
        video_id: Property.ShortText({
            displayName: 'Video ID',
            description: 'The ID of the video to add to the album (e.g., 123456789)',
            required: true,
        }),
        album_id: Property.ShortText({
            displayName: 'Album ID',
            description: 'The ID of the album/showcase to add the video to (e.g., 987654321)',
            required: true,
        }),
        user_id: Property.ShortText({
            displayName: 'User ID (Optional)',
            description: 'The ID of the user who owns the album. Leave empty to use your own albums.',
            required: false,
        }),
    },
    async run(context) {
        const { video_id, album_id, user_id } = context.propsValue;

        if (!video_id || !album_id) {
            throw new Error('Both Video ID and Album ID are required');
        }

        try {
            const resourceUri = user_id 
                ? `/users/${user_id}/albums/${album_id}/videos/${video_id}`
                : `/me/albums/${album_id}/videos/${video_id}`;

            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.PUT,
                resourceUri: resourceUri,
            });

            if (response.status === 204) {
                return {
                    success: true,
                    message: `Video ${video_id} successfully added to album ${album_id}`,
                    video_id,
                    album_id,
                    user_id: user_id || 'me',
                    action_performed: 'video_added_to_album'
                };
            } else {
                throw new Error(`Unexpected response status: ${response.status}. Expected 204 No Content.`);
            }
        } catch (error: any) {
            if (error.response?.body?.error_code) {
                const errorCode = error.response.body.error_code;
                const errorMessage = error.response.body.developer_message || error.response.body.error || 'Unknown error';
                
                throw new Error(`Vimeo API error ${errorCode}: ${errorMessage}`);
            }

            if (error.response?.status === 400) {
                throw new Error('Bad request: Please check that the video ID and album ID are valid and correctly formatted.');
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: You don\'t have permission to add videos to this album. Make sure you own the album or have been granted access.');
            }

            if (error.response?.status === 404) {
                throw new Error('Not found: Either the video or album does not exist. Please verify the IDs are correct.');
            }

            if (error.response?.status === 409) {
                throw new Error('Conflict: The video is already in this album.');
            }
            
            throw new Error(`Failed to add video to album: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
