import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import {
    circleSoAuth,
    circleSoBaseUrl,
    listSpacesDropdown,
    BasicPostFromList,
    ListBasicPostsResponse
} from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const newPostCreated = createTrigger({
    auth: circleSoAuth,
    name: 'new_post_created',
    displayName: 'New Post Created',
    description: 'Triggers when a new post is created in a specific space.',
    props: {
        space_id: listSpacesDropdown
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 2,
        "status": "published",
        "name": "Second post",
        "slug": "kiehn",
        "comments_count": 0,
        "hide_meta_info": false,
        "published_at": "2024-06-27T08:31:30.777Z",
        "created_at": "2024-06-27T08:31:30.781Z",
        "updated_at": "2024-06-27T08:31:30.784Z",
        "is_comments_enabled": true,
        "is_liking_enabled": true,
        "flagged_for_approval_at": null,
        "body": {
            "id": 2,
            "name": "body",
            "body": "<div><!--block-->Iusto sint asperiores sed.</div>",
            "record_type": "Post",
            "record_id": 2,
            "created_at": "2024-06-27T08:31:30.000Z",
            "updated_at": "2024-06-27T08:31:30.000Z"
        },
        "url": "http://dickinson.circledev.net:31337/c/post/kiehn",
        "space_name": "post",
        "space_slug": "post",
        "space_id": 1,
        "user_id": 6,
        "user_email": "lyndon@frami.info",
        "user_name": "Rory Wyman",
        "community_id": 1,
        "user_avatar_url": "https://example.com/avatar.png",
        "cover_image_url": "http://example.com/cover.jpeg",
        "cover_image": "identifier-string",
        "cardview_thumbnail_url": "http://example.com/thumbnail.jpeg",
        "cardview_thumbnail": "identifier-string",
        "is_comments_closed": false,
        "custom_html": "<div>Click Me!</div>",
        "likes_count": 0,
        "member_posts_count": 2,
        "member_comments_count": 0,
        "member_likes_count": 0,
        "topics": [12, 43, 54]
    },
    async onEnable(context) {
        await context.store.put('lastProcessedPostDate', new Date().toISOString());
        return Promise.resolve();
    },
    async onDisable(context) {
        await context.store.delete('lastProcessedPostDate');
        return Promise.resolve();
    },
    async run(context) {
        const lastProcessedPostDate = await context.store.get<string>('lastProcessedPostDate') || new Date(0).toISOString();
        const spaceId = context.propsValue.space_id;
        if (spaceId === undefined) {
            // This should not happen for a required prop
            throw new Error("Space ID is undefined, but it is a required field.");
        }

        const response = await httpClient.sendRequest<ListBasicPostsResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/posts`,
            queryParams: {
                space_id: spaceId.toString(),
                status: 'published',
                sort: 'latest'
            },
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });

        const newPosts = response.body.records.filter((post: BasicPostFromList) => {
            const postPublishedAt = new Date(post.published_at);
            return postPublishedAt > new Date(lastProcessedPostDate);
        }).sort((a: BasicPostFromList, b: BasicPostFromList) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

        if (newPosts.length > 0) {
            const latestPostInBatchDate = newPosts[newPosts.length - 1].published_at;
            await context.store.put('lastProcessedPostDate', latestPostInBatchDate);
        }

        return newPosts;
    },
    async test(context) {
        const spaceId = context.propsValue.space_id;
        if (spaceId === undefined) {
            // This should not happen for a required prop
            throw new Error("Space ID is undefined for test, but it is a required field.");
        }
        const response = await httpClient.sendRequest<ListBasicPostsResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/posts`,
            queryParams: {
                space_id: spaceId.toString(),
                status: 'published',
                per_page: '5',
                sort: 'latest'
            },
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });
        return response.body.records.slice(0, 3);
    }
});
