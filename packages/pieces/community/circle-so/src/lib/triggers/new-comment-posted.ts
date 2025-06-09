import { Property, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import {
    circleSoAuth,
    circleSoBaseUrl,
    listSpacesDropdown,
    listPostsDropdown
} from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

interface CommentBody {
    id: number;
    name: string; // e.g., "body"
    body: string; // HTML content of the comment
    record_type: string; // "Comment"
    record_id: number; // Corresponds to the main comment ID
    created_at: string;
    updated_at: string;
}

interface CommentUser {
    id: number;
    name: string;
    avatar_url: string | null;
    email: string;
}

interface CommentPostInfo {
    id: number;
    name: string;
    slug: string;
}

interface CommentSpaceInfo {
    id: number;
    slug: string;
    name: string;
}

export interface CircleComment {
    id: number;
    parent_comment_id: number | null;
    flagged_for_approval_at: string | null;
    created_at: string;
    body: CommentBody;
    user: CommentUser;
    post: CommentPostInfo;
    space: CommentSpaceInfo;
    url: string;
    community_id: number;
    likes_count: number;
    user_posts_count: number;
    user_likes_count: number;
    user_comments_count: number;
    replies_count?: number;
}

interface ListCommentsResponse {
    page: number;
    per_page: number;
    has_next_page: boolean;
    count: number;
    page_count: number;
    records: CircleComment[];
}

export const newCommentPosted = createTrigger({
    auth: circleSoAuth,
    name: 'new_comment_posted',
    displayName: 'New Comment Posted',
    description: 'Triggers when a new comment is posted in a space or on a specific post.',
    props: {
        space_id: listSpacesDropdown,
        post_id: Property.Dropdown<number>({
            displayName: "Post (Optional)",
            description: "Select a post to trigger on its comments. If empty, triggers on any comment in the selected space.",
            required: false,
            refreshers: listPostsDropdown.refreshers,
            options: listPostsDropdown.options,
        }),
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": 1,
        "parent_comment_id": null,
        "flagged_for_approval_at": null,
        "created_at": "2024-09-02T06:55:07.864Z",
        "body": {
            "id": 3,
            "name": "body",
            "body": "First comment",
            "record_type": "Comment",
            "record_id": 1,
            "created_at": "2024-09-02T06:55:07.000Z",
            "updated_at": "2024-09-02T06:55:07.000Z"
        },
        "user": {
            "id": 2,
            "name": "Alfonzo Treutel",
            "avatar_url": "https://secure.gravatar.com/avatar/0b0d8721ad4cbc76065f8f7992650ea7?default=404&secure=true&size=300",
            "email": "tomika@upton-lemke.io"
        },
        "post": {
            "id": 2,
            "name": "First post",
            "slug": "leuschke"
        },
        "space": {
            "id": 1,
            "slug": "comment",
            "name": "comment"
        },
        "url": "http://mccullough-fay.circledev.net:31337/c/comment/leuschke#comment_wrapper_1",
        "community_id": 1,
        "likes_count": 0,
        "user_posts_count": 2,
        "user_likes_count": 0,
        "user_comments_count": 2,
        "replies_count": 1
    },
    async onEnable(context) {
        await context.store.put('lastProcessedCommentDate', new Date().toISOString());
    },
    async onDisable(context) {
        await context.store.delete('lastProcessedCommentDate');
    },
    async run(context) {
        const lastProcessedDate = await context.store.get<string>('lastProcessedCommentDate') || new Date(0).toISOString();
        const spaceId = context.propsValue.space_id;
        const postId = context.propsValue.post_id;

        if (spaceId === undefined) {
            throw new Error("Space ID is undefined, but it is a required field.");
        }

        const queryParams: Record<string, string> = {
            space_id: spaceId.toString(),
            // The API doesn't explicitly state a sort by created_at,
            // but polling relies on fetching recent items.
            // We will sort client-side after fetching.
            // Fetch a reasonable number per page to minimize missing items if many comments are posted.
            per_page: '50'
        };
        if (postId) {
            queryParams['post_id'] = postId.toString();
        }

        const response = await httpClient.sendRequest<ListCommentsResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/comments`,
            queryParams: queryParams,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });

        const newComments = response.body.records
            .filter(comment => new Date(comment.created_at) > new Date(lastProcessedDate))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Sort ascending by date

        if (newComments.length > 0) {
            const latestCommentInBatchDate = newComments[newComments.length - 1].created_at;
            await context.store.put('lastProcessedCommentDate', latestCommentInBatchDate);
        }

        return newComments;
    },
    async test(context) {
        const spaceId = context.propsValue.space_id;
        const postId = context.propsValue.post_id;

        if (spaceId === undefined) {
            throw new Error("Space ID is undefined for test, but it is a required field.");
        }

        const queryParams: Record<string, string> = {
            space_id: spaceId.toString(),
            per_page: '5' // Fetch a few for testing
        };
        if (postId) {
            queryParams['post_id'] = postId.toString();
        }

        const response = await httpClient.sendRequest<ListCommentsResponse>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/comments`,
            queryParams: queryParams,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });
        // Return the latest 3 for sample data, assuming default API sort is newest first or it doesn't matter for test.
        // If API sorts oldest first, this would take the oldest.
        // For consistency, could sort by created_at desc and take top 3.
        return response.body.records.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
    }
});
