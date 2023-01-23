import {createAction} from "../../../../framework/action/action";
import { OAuth2PropertyValue, Property } from "../../../../framework/property";
import {getMailChimpServerPrefix, mailChimpAuth} from "../../common";
import * as mailchimp from "@mailchimp/mailchimp_marketing";


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
        listId: Property.Dropdown<string>({
            displayName: "Audience",
            refreshers: ["authentication"],
            description: "Audience you want to add the contact to",
            required: true,
            options: async (propsValue) => {
                if (propsValue['authentication'] === undefined) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please select an authentication"
                    }
                }
                const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
                const lists =  (await getUserLists(authProp)).lists;
                return {
                    disabled: false,
                    options: lists.map(l => {
                        return {
                            label:l.name,
                            value: l.id
                        }
                    })
                };
            }
        }),
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
    
    async run(context) {
        const access_token= context.propsValue.authentication?.access_token;
        const mailChimpServerPrefix = await getMailChimpServerPrefix(access_token!);
        mailchimp.setConfig({
            accessToken: access_token,
            server: mailChimpServerPrefix
          });
        
       return await mailchimp.lists.addListMember(context.propsValue.listId!,{email_address:context.propsValue.email!, status:context.propsValue.status!})
    },
});
async function getUserLists(authProp: OAuth2PropertyValue): Promise<{lists:MailChimpList[]}> {
    const access_token= authProp.access_token;
        const mailChimpServerPrefix = await getMailChimpServerPrefix(access_token!);
        mailchimp.setConfig({
            accessToken: access_token,
            server: mailChimpServerPrefix
          });
          console.log(`token:${access_token}`);
          console.log(`server ${ mailChimpServerPrefix}`);
          //mailchimp types are not complete this is from the docs.
          return (await (mailchimp as any).lists.getAllLists({fields:["lists.id","lists.name","total_items"],count:1000}));
}
interface MailChimpList
{
    id:string;
    name:string;
}