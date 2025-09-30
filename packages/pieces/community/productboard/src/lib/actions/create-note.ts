import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const createNote = createAction({
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Creates a new note in Productboard with rich content and associations',
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
        display_url: Property.ShortText({
            displayName: 'Display URL',
            description: 'URL where the external entity can be accessed (displayed as clickable title)',
            required: false,
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'Email address of the user associated with this note',
            required: false,
        }),
        user_external_id: Property.ShortText({
            displayName: 'User External ID',
            description: 'External ID of the user in your system',
            required: false,
        }),
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'Company to associate with the note',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first'
                    };
                }

                try {
                    const response = await productboardCommon.apiCall({
                        auth: auth as string,
                        method: HttpMethod.GET,
                        resourceUri: '/companies'
                    });

                    const companies = response.body.data || [];
                    return {
                        disabled: false,
                        options: companies.map((company: any) => ({
                            label: company.name || `Company ${company.id}`,
                            value: company.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading companies'
                    };
                }
            }
        }),
        company_domain: Property.ShortText({
            displayName: 'Company Domain',
            description: 'Domain of the company to associate with the note',
            required: false,
        }),
        company_external_id: Property.ShortText({
            displayName: 'Company External ID',
            description: 'External ID of the company in your system',
            required: false,
        }),
        source_name: Property.ShortText({
            displayName: 'Source Name',
            description: 'Name of the external system where this feedback originated',
            required: false,
        }),
        source_url: Property.ShortText({
            displayName: 'Source URL',
            description: 'URL of the original source entity',
            required: false,
        }),
        source_external_id: Property.ShortText({
            displayName: 'Source External ID',
            description: 'External ID in the origin system',
            required: false,
        }),
        owner_email: Property.ShortText({
            displayName: 'Owner Email',
            description: 'Email address of the user to add as note owner',
            required: false,
        }),
        owner_external_id: Property.ShortText({
            displayName: 'Owner External ID',
            description: 'External ID of the owner in your system',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to categorize the note (case and diacritic insensitive)',
            required: false,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag',
                    description: 'Tag name for categorizing the note',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        try {
            const note: Record<string, any> = {
                title: context.propsValue.title,
                content: context.propsValue.content,
            };

            // Add display_url if provided
            if (context.propsValue.display_url) {
                note['display_url'] = context.propsValue.display_url;
            }

            // Add user object if user fields are provided
            if (context.propsValue.user_email || context.propsValue.user_external_id) {
                note['user'] = {};
                if (context.propsValue.user_email) {
                    note['user'].email = context.propsValue.user_email;
                }
                if (context.propsValue.user_external_id) {
                    note['user'].external_id = context.propsValue.user_external_id;
                }
            }

            // Add company object if company fields are provided
            if (context.propsValue.company_id || context.propsValue.company_domain || context.propsValue.company_external_id) {
                note['company'] = {};
                if (context.propsValue.company_id) {
                    note['company'].id = context.propsValue.company_id;
                }
                if (context.propsValue.company_domain) {
                    note['company'].domain = context.propsValue.company_domain;
                }
                if (context.propsValue.company_external_id) {
                    note['company'].external_id = context.propsValue.company_external_id;
                }
            }

            // Add source object if source fields are provided
            if (context.propsValue.source_name || context.propsValue.source_url || context.propsValue.source_external_id) {
                note['source'] = {};
                if (context.propsValue.source_name) {
                    note['source'].name = context.propsValue.source_name;
                }
                if (context.propsValue.source_url) {
                    note['source'].url = context.propsValue.source_url;
                }
                if (context.propsValue.source_external_id) {
                    note['source'].external_id = context.propsValue.source_external_id;
                }
            }

            // Add owner object if owner fields are provided
            if (context.propsValue.owner_email || context.propsValue.owner_external_id) {
                note['owner'] = {};
                if (context.propsValue.owner_email) {
                    note['owner'].email = context.propsValue.owner_email;
                }
                if (context.propsValue.owner_external_id) {
                    note['owner'].external_id = context.propsValue.owner_external_id;
                }
            }

            // Add tags as array of strings if provided
            if (context.propsValue.tags && context.propsValue.tags.length > 0) {
                note['tags'] = context.propsValue.tags.map((tagObj: any) => tagObj.tag);
            }

            const response = await productboardCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.POST,
                resourceUri: '/notes',
                body: note
            });

            return response.body;
        } catch (error) {
            throw new Error(`Failed to create note: ${error}`);
        }
    },
});
