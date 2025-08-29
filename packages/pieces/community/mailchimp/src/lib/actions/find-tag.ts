import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findTag = createAction({
    auth: mailchimpAuth,
    name: 'find_tag',
    displayName: 'Find Tag',
    description: 'Finds one or more tags in an audience by name.',
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        name: Property.ShortText({
            displayName: 'Tag Name',
            description: 'The name of the tag to search for. If left blank, all tags in the audience will be returned.',
            required: false,
        }),
    },
    async run(context) {
        const { list_id, name } = context.propsValue;
        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).lists.tagSearch(list_id, {
            name: name,
        });
    },
});