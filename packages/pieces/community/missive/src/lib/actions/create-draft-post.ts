import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const createDraftPost = createAction({
    name: 'create_draft_post',
    displayName: 'Create Draft/Post',
    description: 'Create a draft message or post in Missive, with option to send',
    auth: missiveAuth,
    props: {
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: 'Type of draft to create',
            required: true,
            options: {
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Post', value: 'post' }
                ]
            }
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            description: 'Subject of the message or post',
            required: false,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'Content of the message or post',
            required: true,
        }),
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'ID of the conversation to add the draft/post to',
            required: false,
        }),
        references: Property.Array({
            displayName: 'References',
            description: 'Message references (e.g., email Message-IDs)',
            required: false,
            properties: {
                reference: Property.ShortText({
                    displayName: 'Reference',
                    description: 'Message reference',
                    required: true,
                })
            }
        }),
        to: Property.Array({
            displayName: 'To',
            description: 'Recipients to send the message to',
            required: false,
            properties: {
                email: Property.ShortText({
                    displayName: 'Email',
                    description: 'Email address',
                    required: true,
                }),
                name: Property.ShortText({
                    displayName: 'Name',
                    description: 'Recipient name',
                    required: false,
                })
            }
        }),
        cc: Property.Array({
            displayName: 'CC',
            description: 'CC recipients',
            required: false,
            properties: {
                email: Property.ShortText({
                    displayName: 'Email',
                    description: 'Email address',
                    required: true,
                }),
                name: Property.ShortText({
                    displayName: 'Name',
                    description: 'Recipient name',
                    required: false,
                })
            }
        }),
        bcc: Property.Array({
            displayName: 'BCC',
            description: 'BCC recipients',
            required: false,
            properties: {
                email: Property.ShortText({
                    displayName: 'Email',
                    description: 'Email address',
                    required: true,
                }),
                name: Property.ShortText({
                    displayName: 'Name',
                    description: 'Recipient name',
                    required: false,
                })
            }
        }),
        send: Property.Checkbox({
            displayName: 'Send Immediately',
            description: 'Whether to send the message immediately or save as draft',
            required: false,
            defaultValue: false,
        }),
        account: Property.ShortText({
            displayName: 'Account ID',
            description: 'ID of the account to send from',
            required: false,
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            description: 'File attachments',
            required: false,
            properties: {
                filename: Property.ShortText({
                    displayName: 'Filename',
                    description: 'Name of the file',
                    required: true,
                }),
                content: Property.ShortText({
                    displayName: 'Content',
                    description: 'Base64 encoded file content',
                    required: true,
                }),
                content_type: Property.ShortText({
                    displayName: 'Content Type',
                    description: 'MIME type of the file',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        const {
            type,
            subject,
            content,
            conversation_id,
            references,
            to,
            cc,
            bcc,
            send,
            account,
            attachments
        } = context.propsValue;

        const draftData: Record<string, any> = {
            type,
            content,
        };
        if (subject) draftData['subject'] = subject;
        if (conversation_id) draftData['conversation'] = conversation_id;
        if (send !== undefined) draftData['send'] = send;
        if (account) draftData['account'] = account;
        if (references && references.length > 0) draftData['references'] = references.map((ref: any) => ref.reference);
        if (to && to.length > 0) draftData['to'] = to.map((recipient: any) => ({ email: recipient.email, name: recipient.name }));
        if (cc && cc.length > 0) draftData['cc'] = cc.map((recipient: any) => ({ email: recipient.email, name: recipient.name }));
        if (bcc && bcc.length > 0) draftData['bcc'] = bcc.map((recipient: any) => ({ email: recipient.email, name: recipient.name }));
        if (attachments && attachments.length > 0) draftData['attachments'] = attachments.map((attachment: any) => ({ filename: attachment.filename, content: attachment.content, content_type: attachment.content_type }));

        const endpoint = type === 'post' ? '/posts' : '/drafts';
        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: endpoint,
            body: {
                [type === 'post' ? 'posts' : 'drafts']: [draftData]
            },
        });
        return response.body;
    },
}); 