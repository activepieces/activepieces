import { Property, createAction } from "@activepieces/pieces-framework";
import {
    circleSoAuth,
    circleSoBaseUrl,
    listSpacesDropdown,
    listPostsDropdown
} from "../common";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

interface CreateCommentPayload {
    post_id: number;
    body: string;
    parent_comment_id?: number;
    skip_notifications?: boolean;
}

export const createComment = createAction({
    auth: circleSoAuth,
    name: 'create_comment',
    displayName: 'Create Comment',
    description: 'Create a new comment on a post.',
    props: {
        space_id: listSpacesDropdown,
        post_id: listPostsDropdown,
        body: Property.LongText({
            displayName: 'Comment Body',
            description: 'The content of the comment.',
            required: true,
        }),
        parent_comment_id: Property.Number({
            displayName: 'Parent Comment ID (Optional)',
            description: 'ID of the comment to reply to. Leave empty if not a reply.',
            required: false,
        }),
        skip_notifications: Property.Checkbox({
            displayName: 'Skip Notifications',
            description: 'Skip sending notifications for this comment?',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { post_id, body, parent_comment_id, skip_notifications } = context.propsValue;

        if (post_id === undefined) {
            throw new Error("Post ID is required but was not provided.");
        }
        if (body === undefined) {
            throw new Error("Comment body is required but was not provided.");
        }

        const payload: CreateCommentPayload = {
            post_id: post_id,
            body: body,
        };

        if (parent_comment_id !== undefined && parent_comment_id !== null) {
            payload.parent_comment_id = parent_comment_id;
        }
        if (skip_notifications !== undefined) {
            payload.skip_notifications = skip_notifications;
        }

        const response = await httpClient.sendRequest<any>({
            method: HttpMethod.POST,
            url: `${circleSoBaseUrl}/comments`,
            body: payload,
            headers: {
                "Authorization": `Bearer ${context.auth}`,
                "Content-Type": "application/json"
            }
        });

        return response.body;
    }
});
