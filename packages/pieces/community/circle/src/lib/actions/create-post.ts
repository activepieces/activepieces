import { MarkdownVariant, Property, createAction } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { circleAuth } from "../common/auth";
import { BASE_URL, spaceIdDropdown } from "../common";

interface TipTapPayloadBody {
    type: string;
    content: unknown[];
}

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
    published_at?: string;
    created_at?: string;
    topics?: number[];
    skip_notifications?: boolean;
    is_pinned?: boolean;
    user_email?: string;
    user_id?: number;
}

function isTipTapDocument(value: unknown): value is TipTapPayloadBody {
    return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string' &&
        'content' in value &&
        Array.isArray(value.content)
    );
}

function resolveTipTapBody(input: unknown): { body: TipTapPayloadBody } | undefined {
    if (typeof input !== 'object' || input === null) {
        return undefined;
    }
    if ('body' in input && isTipTapDocument(input.body)) {
        return { ...input, body: input.body };
    }
    if (isTipTapDocument(input)) {
        return { body: input };
    }
    return undefined;
}

export const createPost = createAction({
    auth: circleAuth,
    name: 'create_post',
    classification: 'WRITE',
    displayName: 'Create Post',
    description: 'Creates a new post in a specific space.',
    audience: 'both',
    aiMetadata: { description: 'Publishes a new post into a given Circle space, accepting body content as either plain text or a full TipTap JSON document (JSON wins if both are supplied). Use to programmatically add community content; status can be draft, published, or scheduled (a scheduled status needs a future publish time). Creates a new post on each call, so it is not idempotent.', idempotent: false },
    props: {
        space_id: spaceIdDropdown,
        name: Property.ShortText({
            displayName: 'Title',
            description: 'The title shown at the top of the post.',
            placeholder: 'Weekly community update',
            required: true,
        }),
        body_info: Property.MarkDown({
            value: 'Write the post in Body. For formatting, paste a TipTap document in TipTap Body instead; it wins when both are set.',
            variant: MarkdownVariant.INFO,
        }),
        text_body: Property.LongText({
            displayName: 'Body',
            description: 'Plain text content of the post.',
            required: false,
        }),
        tiptap_body_json: Property.Json({
            displayName: 'TipTap Body',
            description: 'A TipTap JSON document, with or without a top-level body key.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Draft, publish now, or schedule for later.',
            required: false,
            width: 'half',
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
            displayName: 'Publish Date',
            description: 'Required when Status is Scheduled.',
            placeholder: '2026-12-01 09:00',
            required: false,
            width: 'half',
        }),
        is_comments_enabled: Property.Checkbox({
            displayName: 'Enable Comments',
            description: 'Let members comment on this post.',
            required: false,
            advanced: true,
            defaultValue: true,
        }),
        skip_notifications: Property.Checkbox({
            displayName: 'Skip Notifications',
            description: "Don't notify members about this post.",
            required: false,
            advanced: true,
            defaultValue: false,
        }),
        user_email: Property.ShortText({
            displayName: 'Post As',
            description: 'Member email to post as; leave empty to post as the admin.',
            placeholder: 'member@example.com',
            required: false,
            advanced: true,
        })
    },
    propertyGroups: [
        { key: 'post', display: 'section', label: 'Post', icon: 'file', props: ['space_id', 'name'] },
        { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['body_info', 'text_body', 'tiptap_body_json'] },
        { key: 'publishing', display: 'section', label: 'Publishing', icon: 'calendar', props: ['status', 'published_at'] },
    ],
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

        const validTipTapBody = resolveTipTapBody(tiptap_body_json);
        const emptyBody: { body: TipTapPayloadBody } = {
            body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] }
        };
        const textBody: { body: TipTapPayloadBody } | undefined = text_body
            ? { body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: text_body }] }] } }
            : undefined;
        const finalTiptapBody = validTipTapBody ?? textBody ?? emptyBody;

        if (status === 'scheduled' && !published_at) {
            throw new Error('Scheduled posts need a Publish Date.');
        }

        const payload: CreatePostPayload = {
            space_id: space_id,
            name: name,
            tiptap_body: finalTiptapBody,
            status: status ?? 'published',
        };

        if (published_at && payload.status === 'scheduled') {
            payload.published_at = new Date(published_at).toISOString();
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
                "Authorization": `Bearer ${context.auth.secret_text}`,
                "Content-Type": "application/json"
            }
        });

        return response.body;
    }
});
