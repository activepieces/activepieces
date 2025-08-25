
import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { vimeoAuth } from '../common';

// Define the props for the trigger
const props = {
    userId: Property.ShortText({
        displayName: 'User ID or Username',
        description: 'The Vimeo user ID or username to monitor for new videos',
        required: true,
    }),
    sort: Property.StaticDropdown({
        displayName: 'Sort Order',
        description: 'How to sort the user\'s videos',
        required: false,
        options: {
            options: [
                { label: 'Most Recent', value: 'date' },
                { label: 'Most Popular', value: 'plays' },
                { label: 'Most Liked', value: 'likes' },
                { label: 'Alphabetical', value: 'alphabetical' }
            ]
        },
        defaultValue: 'date'
    })
};

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS, auth }) => {
        const { userId, sort = 'date' } = propsValue;
        const accessToken = auth;
        
        // First, try to get user info to validate the user ID/username
        let userUri = userId;
        
        // If userId is not a URI, try to find the user
        if (!userId.startsWith('/users/')) {
            try {
                const userResponse = await fetch(
                    `https://api.vimeo.com/users?query=${encodeURIComponent(userId)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.data && userData.data.length > 0) {
                        userUri = userData.data[0].uri;
                    } else {
                        throw new Error(`User '${userId}' not found`);
                    }
                }
            } catch (error) {
                throw new Error(`Failed to find user '${userId}': ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        // Fetch videos from the specified user
        const response = await fetch(
            `https://api.vimeo.com${userUri}/videos?sort=${sort}&direction=desc&per_page=25`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const videos = data.data || [];

        // Filter videos created after the last fetch
        const filteredVideos = videos.filter((video: any) => {
            const videoDate = dayjs(video.created_time).valueOf();
            return videoDate > lastFetchEpochMS;
        });

        return filteredVideos.map((video: any) => ({
            epochMilliSeconds: dayjs(video.created_time).valueOf(),
            data: {
                id: video.uri.split('/').pop(),
                title: video.name,
                description: video.description,
                created_time: video.created_time,
                duration: video.duration,
                plays: video.stats?.plays || 0,
                likes: video.metadata?.connections?.likes?.total || 0,
                comments: video.metadata?.connections?.comments?.total || 0,
                link: video.link,
                thumbnail: video.pictures?.base_link,
                user: {
                    name: video.user?.name,
                    link: video.user?.link,
                    uri: video.user?.uri
                },
                privacy: video.privacy?.view,
                embed: video.privacy?.embed,
                download: video.privacy?.download
            }
        }));
    }
};

export const newVideoByUser = createTrigger({
    auth: vimeoAuth,
    name: 'new-video-by-user',
    displayName: 'New Video by User',
    description: 'Fires when another specified user adds a video. Track a partner\'s account and mirror new uploads into your content calendar.',
    props: props,
    sampleData: {
        id: '123456789',
        title: 'Partner Video Title',
        description: 'This is a video uploaded by the monitored user',
        created_time: '2024-01-01T00:00:00Z',
        duration: 180,
        plays: 250,
        likes: 45,
        comments: 12,
        link: 'https://vimeo.com/123456789',
        thumbnail: 'https://i.vimeocdn.com/video/123456789_640.jpg',
        user: {
            name: 'Partner User',
            link: 'https://vimeo.com/partneruser',
            uri: '/users/12345'
        },
        privacy: 'anybody',
        embed: 'whitelist',
        download: false
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});