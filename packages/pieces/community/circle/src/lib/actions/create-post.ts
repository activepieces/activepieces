import { Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { circleAuth } from "../common/auth";
import { BASE_URL, spaceIdDropdown } from "../common";

// Interface for the TipTap body structure (simplified for payload)
interface TipTapPayloadBody {
    type: string; // "doc"
    content: any[]; // Content structure for TipTap
}

// Interface for the full payload to create a post
interface CreatePostPayload {
    space_id: number;
    name: string;
    status?: string;
    tiptap_body: { body: TipTapPayloadBody };
    slug?: string;
    cover_image?: string;
    internal_custom_html?: string;
    is_truncation_disabled?: boolean;
    is_comments_closed?: boolean;
    is_comments_enabled?: boolean;
    is_liking_enabled?: boolean;
    hide_meta_info?: boolean;
    hide_from_featured_areas?: boolean;
    meta_title?: string;
    meta_description?: string;
    opengraph_title?: string;
    opengraph_description?: string;
    published_at?: string; // ISO 8601 string
    created_at?: string; // ISO 8601 string - usually set by server
    topics?: number[];
    skip_notifications?: boolean;
    is_pinned?: boolean;
    user_email?: string;
    user_id?: number;
}

export const createPost = createAction({
    auth: circleAuth,
    name: 'create_post',
    displayName: 'Create Post',
    description: 'Creates a new post in a specific space.',
    props: {
        space_id: spaceIdDropdown,
        name: Property.ShortText({
            displayName: 'Post Name/Title',
            description: 'The title of the post.',
            required: true,
        }),
        text_body: Property.LongText({
            displayName: 'Post Body (Plain Text)',
            description: "Simple plain text content for the post. Used if 'Tiptap Body JSON' is not provided.",
            required: false,
        }),
        tiptap_body_json: Property.Json({
            displayName: 'Tiptap Body JSON',
            description: "Full TipTap JSON object for the post body. If provided, 'Post Body (Plain Text)' is ignored.",
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The status of the post.',
            required: false,
            options: {
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Scheduled', value: 'scheduled' },
                ]
            },
            defaultValue: 'published',
        }),
        published_at: Property.DateTime({
            displayName: 'Published At (for Scheduled)',
            description: "If status is 'scheduled', provide the future date and time for publishing.",
            required: false,
        }),
        is_comments_enabled: Property.Checkbox({
            displayName: 'Enable Comments',
            description: 'Allow comments on this post?',
            required: false,
            defaultValue: true,
        }),
        skip_notifications: Property.Checkbox({
            displayName: 'Skip Notifications',
            description: 'Prevent notifications from being sent for this post?',
            required: false,
            defaultValue: false,
        }),
        user_email: Property.ShortText({
            displayName: 'Post As User Email (Optional)',
            description: 'Email of an existing community member to create this post as. If empty, posts as the authenticated admin.',
            required: false,
        })
    },
    async run(context) {
        const {
            space_id, name, text_body, tiptap_body_json,
            status, published_at, is_comments_enabled,
            skip_notifications, user_email
        } = context.propsValue;

        if (space_id === undefined) {
            throw new Error("Space ID is undefined, but it is a required field.");
        }
        if (name === undefined) {
            throw new Error("Post Name/Title is undefined, but it is a required field.");
        }

        let finalTiptapBody: { body: TipTapPayloadBody };

        if (tiptap_body_json && typeof tiptap_body_json === 'object' && (tiptap_body_json as any).body) {
            finalTiptapBody = tiptap_body_json as { body: TipTapPayloadBody };
        } else if (text_body) {
            finalTiptapBody = {
                body: {
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                { type: "text", text: text_body }
                            ]
                        }
                    ]
                }
            };
        } else if (!text_body && !tiptap_body_json) {
            finalTiptapBody = {
                body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] }
            };
        } else {
             throw new Error("Invalid body input. Provide either 'Post Body (Plain Text)' or a valid 'Tiptap Body JSON'. If both are empty, an empty post will be created.");
        }

        const payload: CreatePostPayload = {
            space_id: space_id,
            name: name,
            tiptap_body: finalTiptapBody,
            status: status ?? 'published',
        };

        if (published_at && payload.status === 'scheduled') {
            payload.published_at = new Date(published_at).toISOString();
        } else if (payload.status === 'scheduled' && !published_at) {
            // It's an error to have scheduled status without a published_at date.
            // However, the API might handle this. For now, we'll let it pass,
            // but this could be a validation point.
        }

        if (is_comments_enabled !== undefined) {
            payload.is_comments_enabled = is_comments_enabled;
            payload.is_comments_closed = !is_comments_enabled;
        }
        if (skip_notifications !== undefined) {
            payload.skip_notifications = skip_notifications;
        }
        if (user_email) {
            payload.user_email = user_email;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/posts`,
            body: payload,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });

        return response.body;
    }
});
