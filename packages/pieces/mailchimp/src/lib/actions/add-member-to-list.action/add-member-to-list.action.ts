import { getMailChimpServerPrefix, mailChimpListIdDropdown } from "../../common";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { createAction, Property } from "@activepieces/pieces-framework";
import { mailchimpAuth } from "../../..";

export const addMemberToList = createAction({
        auth: mailchimpAuth,
        name: 'add_member_to_list',
        displayName: "Add Member to an Audience (List)",
        description: "Add a member to an existing Mailchimp audience (list)",
        props: {
            first_name: Property.ShortText({
                displayName: 'First Name',
                description: 'First name of the new contact',
                required: false,
            }),
            last_name: Property.ShortText({
                displayName: 'Last Name',
                description: 'Last name of the new contact',
                required: false,
            }),
            email: Property.ShortText({
                displayName: 'Email',
                description: 'Email of the new contact',
                required: true,
            }),
            list_id: mailChimpListIdDropdown,
            status: Property.StaticDropdown<'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'>({
                displayName: "Status",
                required: true,
                options: {
                    disabled: false, options: [
                        { label: 'Subscribed', value: 'subscribed' },
                        { label: 'Unsubscribed', value: 'unsubscribed' },
                        { label: 'Cleaned', value: 'cleaned' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Transactional', value: 'transactional' }
                    ]
                }
            })
        },
        async run(context) {
            const access_token = context.auth.access_token;
            const mailChimpServerPrefix = await getMailChimpServerPrefix(access_token);
            mailchimp.setConfig({
                accessToken: access_token,
                server: mailChimpServerPrefix
            });
            return await mailchimp.lists.addListMember(context.propsValue.list_id!, {
                email_address: context.propsValue.email!,
                status: context.propsValue.status!,
                merge_fields: {
                    FNAME: context.propsValue.first_name || '',
                    LNAME: context.propsValue.last_name || ''
                }
            })
        },
});
