import { createAction } from "@activepieces/pieces-framework";
import { circleSoAuth, circleSoBaseUrl, listSpacesDropdown, listPostsDropdown } from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

interface PostBody {
    id: number;
    name: string; // "body"
    body: string; // HTML content
    record_type: string; // "Post"
    record_id: number;
    created_at: string;
    updated_at: string;
}

interface TipTapMark {
    type: string;
    attrs?: Record<string, unknown>; // Example: { href: 'url' } for a link mark
}

interface TipTapContentItem {
    type: string;
    text?: string;
    marks?: TipTapMark[];
    attrs?: Record<string, unknown>;
    content?: TipTapContentItem[];
    circle_ios_fallback_text?: string;
}

interface TipTapBody {
    body: {
        type: string; // "doc"
        content: TipTapContentItem[];
    };
    circle_ios_fallback_text?: string;
    attachments?: unknown[];
    inline_attachments?: unknown[];
    sgids_to_object_map?: Record<string, unknown>;
    format?: string; // "post"
    community_members?: unknown[];
    entities?: unknown[];
    group_mentions?: unknown[];
    polls?: unknown[];
}

interface PostDetails {
    id: number;
    status: string;
    name: string;
    slug: string;
    comments_count: number;
    hide_meta_info: boolean;
    published_at: string;
    created_at: string;
    updated_at: string;
    is_comments_enabled: boolean;
    is_liking_enabled: boolean;
    flagged_for_approval_at: string | null;
    body: PostBody;
    tiptap_body: TipTapBody;
    url: string;
    space_name: string;
    space_slug: string;
    space_id: number;
    user_id: number;
    user_email: string;
    user_name: string;
    community_id: number;
    user_avatar_url: string | null;
    cover_image_url: string | null;
    cover_image: string | null; // This seems to be an identifier string
    cardview_thumbnail_url: string | null;
    cardview_thumbnail: string | null; // Also an identifier
    is_comments_closed: boolean;
    custom_html: string | null;
    likes_count: number;
    member_posts_count: number;
    member_comments_count: number;
    member_likes_count: number;
    topics: number[];
}

export const getPostDetails = createAction({
    auth: circleSoAuth,
    name: 'get_post_details',
    displayName: 'Get Post Details',
    description: 'Retrieve the complete details of a specific post.',
    props: {
        space_id: listSpacesDropdown, // For user to select a space first
        post_id: listPostsDropdown,   // Then select a post from that space
    },
    async run(context) {
        const { post_id } = context.propsValue;

        if (post_id === undefined) {
            throw new Error("Post ID is undefined, but it is a required field.");
        }

        const response = await httpClient.sendRequest<PostDetails>({
            method: HttpMethod.GET,
            url: `${circleSoBaseUrl}/posts/${post_id}`,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            },
        });
        return response.body;
    }
});
