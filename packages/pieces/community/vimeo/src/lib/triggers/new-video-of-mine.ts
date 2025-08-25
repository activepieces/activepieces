
import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { vimeoAuth } from '../common';

// Define the props for the trigger
const props = {
    sort: Property.StaticDropdown({
        displayName: 'Sort Order',
        description: 'How to sort your uploaded videos',
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
    }),
    privacy: Property.StaticDropdown({
        displayName: 'Privacy Filter',
        description: 'Filter videos by privacy setting',
        required: false,
        options: {
            options: [
                { label: 'All Videos', value: 'all' },
                { label: 'Public Only', value: 'anybody' },
                { label: 'Private Only', value: 'nobody' },
                { label: 'Contacts Only', value: 'contacts' },
                { label: 'Password Protected', value: 'password' },
                { label: 'Unlisted', value: 'unlisted' }
            ]
        },
        defaultValue: 'all'
    })
};

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS, auth }) => {
        const { sort = 'date', privacy = 'all' } = propsValue;
        const accessToken = auth;
        
        // First, get the authenticated user's information
        const userResponse = await fetch(
            'https://api.vimeo.com/me',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!userResponse.ok) {
            throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        const userUri = userData.uri;

        // Build the API URL with privacy filter if specified
        let apiUrl = `https://api.vimeo.com${userUri}/videos?sort=${sort}&direction=desc&per_page=25`;
        if (privacy !== 'all') {
            apiUrl += `&privacy.view=${privacy}`;
        }

        // Fetch videos uploaded by the authenticated user
        const response = await fetch(
            apiUrl,
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
        const uploadedVideos = data.data || [];

        // Filter videos uploaded after the last fetch
        const filteredVideos = uploadedVideos.filter((video: any) => {
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
                privacy: video.privacy?.view,
                embed: video.privacy?.embed,
                download: video.privacy?.download,
                category: video.category?.name,
                tags: video.tags?.map((tag: any) => tag.name) || [],
                content_rating: video.content_rating || [],
                upload_date: video.upload?.date,
                upload_status: video.upload?.status,
                upload_link: video.upload?.link,
                download_links: video.download || [],
                width: video.width,
                height: video.height,
                fps: video.fps,
                hdr: video.hdr || false
            }
        }));
    }
};

export const newVideoOfMine = createTrigger({
    auth: vimeoAuth,
    name: 'new-video-of-mine',
    displayName: 'New Video of Mine',
    description: 'Fires when you add/upload a new video. Send an email newsletter or publish a CMS post whenever you upload a video.',
    props: props,
    sampleData: {
        id: '123456789',
        title: 'My New Upload',
        description: 'This is a video I just uploaded to Vimeo',
        created_time: '2024-01-01T00:00:00Z',
        duration: 300,
        plays: 0,
        likes: 0,
        comments: 0,
        link: 'https://vimeo.com/123456789',
        thumbnail: 'https://i.vimeocdn.com/video/123456789_640.jpg',
        privacy: 'anybody',
        embed: 'public',
        download: false,
        category: 'Documentary',
        tags: ['personal', 'creative'],
        content_rating: ['safe'],
        upload_date: '2024-01-01T00:00:00Z',
        upload_status: 'complete',
        upload_link: null,
        download_links: [],
        width: 1920,
        height: 1080,
        fps: 30,
        hdr: false
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