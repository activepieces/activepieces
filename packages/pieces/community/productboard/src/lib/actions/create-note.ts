import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const createNote = createAction({
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Creates a new note in Productboard',
    auth: productboardAuth,
    props: {
        title: Property.ShortText({
            displayName: 'Note Title',
            description: 'Title of the feedback note',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'HTML-encoded rich text content of the feedback note',
            required: true,
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: "Email address of a user to be attached to the note. This field can't be combined with `Company Domain`.",
            required: false,
        }),
        company_domain: Property.ShortText({
            displayName: 'Company Domain',
            description: "Domain of a company the note should be linked to. This field can't be combined with `User Email`.",
            required: false,
        }),
        display_url: Property.ShortText({
            displayName: 'Display URL',
            description: 'URL where the external entity can be accessed.',
            required: false,
        }),
        source_origin: Property.ShortText({
            displayName: 'Source Origin',
            description: 'A unique string identifying the external system from which the data came.',
            required: false,
        }),
        source_record_id: Property.ShortText({
            displayName: 'Source Record ID',
            description: 'The unique id of the record in the origin system.',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'A set of tags for categorizing the note.',
            required: false,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        const {
            title,
            content,
            user_email,
            company_domain,
            display_url,
            source_origin,
            source_record_id,
            tags,
        } = context.propsValue;

        const note: Record<string, any> = {
            title,
            content,
        };

        if (user_email) {
            note['user'] = { email: user_email };
        }

        if (company_domain) {
            note['company'] = { domain: company_domain };
        }

        if (display_url) {
            note['display_url'] = display_url;
        }

        if (source_origin && source_record_id) {
            note['source'] = {
                origin: source_origin,
                record_id: source_record_id,
            };
        }

        if (tags) {
            note['tags'] = (tags as { tag: string }[]).map((t) => t.tag);
        }

        const response = await productboardCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/notes',
            body: note,
        });

        return response.body;
    },
});
