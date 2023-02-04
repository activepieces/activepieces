import {createAction} from "../../../../framework/action/action";
import { Property } from "../../../../framework/property";
import {getMailChimpServerPrefix, mailChimpAuth, mailChimpListIdDropdown} from "../../common";
import mailchimp from "@mailchimp/mailchimp_marketing";


export const addMemberToList = createAction({
    name: 'add_member_to_list',
    displayName: "Add Member to an Audience (List)",
    description: "Add a member to an existing Mailchimp audience (list)",
    props: {
        authentication: mailChimpAuth,
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email of the new contact',
            required: true,
        }),
        list_id: mailChimpListIdDropdown,
        status: Property.Dropdown<'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'>({
            displayName: "Status",
            refreshers: [],
            required: true,
            options: async () => {
            return {disabled:false, options:[
                {label:'Subscribed', value:'subscribed'},
                {label:'Unsubscribed', value: 'unsubscribed'},
                {label:'Cleaned', value:'cleaned'},
                {label: 'Pending', value: 'pending'},
                {label:'Transactional',value:'transactional'}
            ]} ;}

        })
    },
    sampleData: {},
    async run(context) {
        const access_token= context.propsValue.authentication?.access_token;
        const mailChimpServerPrefix = await getMailChimpServerPrefix(access_token!);
        mailchimp.setConfig({
            accessToken: access_token,
            server: mailChimpServerPrefix
          });

       return await mailchimp.lists.addListMember(context.propsValue.list_id!,{email_address:context.propsValue.email!, status:context.propsValue.status!})
    },
});
