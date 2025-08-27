import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/client';

export const addVideoToAlbum = createAction({
    name: 'add_video_to_album',
    displayName: 'Add Video to Album',
    description: 'Add a video to your album',
    auth: vimeoAuth,
    props: {
        video: Property.DynamicProperties({
            displayName: 'Video',
            description: 'Choose a video to add',
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
                                description: 'Pick from your videos',
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
        album: Property.DynamicProperties({
            displayName: 'Album',
            description: 'Choose destination album',
            required: true,
            refreshers: [],
            props: async ({ auth }) => {
                if (!auth) {
                    return {
                        album_id: Property.ShortText({
                            displayName: 'Album ID',
                            description: 'Enter album ID manually',
                            required: true,
                        })
                    };
                }

                try {
                    const response = await vimeoCommon.apiCall({
                        auth,
                        method: HttpMethod.GET,
                        resourceUri: '/me/albums',
                        query: { 
                            per_page: '50',
                            sort: 'date',
                            direction: 'desc'
                        }
                    });

                    const albums = response.body?.data || [];
                    const albumOptions = albums.map((album: any) => ({
                        label: `${album.name || 'Untitled Album'} (${album.uri?.split('/').pop()})`,
                        value: album.uri?.split('/').pop()
                    }));

                    if (albumOptions.length > 0) {
                        return {
                            album_id: Property.StaticDropdown({
                                displayName: 'Select Album',
                                description: 'Pick from your albums',
                                required: true,
                                options: {
                                    options: albumOptions
                                }
                            })
                        };
                    } else {
                        return {
                            album_id: Property.ShortText({
                                displayName: 'Album ID',
                                description: 'No albums found. Enter album ID manually',
                                required: true,
                            })
                        };
                    }
                } catch (error) {
                    return {
                        album_id: Property.ShortText({
                            displayName: 'Album ID',
                            description: 'Enter album ID manually',
                            required: true,
                        })
                    };
                }
            }
        }),
    },
    async run(context) {
        const { video, album } = context.propsValue;

        // Extract dynamic property values
        const video_id = video?.['video_id'];
        const album_id = album?.['album_id'];

        if (!video_id || !album_id) {
            throw new Error('Both Video and Album are required');
        }

        try {
            const resourceUri = `/me/albums/${album_id}/videos/${video_id}`;

            const response = await vimeoCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.PUT,
                resourceUri: resourceUri,
            });

            if (response.status === 204) {
                return {
                    success: true,
                    message: `Video successfully added to album`,
                    video_id,
                    album_id,
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
                throw new Error('Invalid request: Please check that the video and album are valid.');
            }

            if (error.response?.status === 403) {
                throw new Error('Permission denied: You don\'t have permission to add videos to this album.');
            }

            if (error.response?.status === 404) {
                throw new Error('Not found: Either the video or album does not exist.');
            }

            if (error.response?.status === 409) {
                throw new Error('Video is already in this album.');
            }
            
            throw new Error(`Failed to add video to album: ${error.message || 'Unknown error occurred'}`);
        }
    },
});
