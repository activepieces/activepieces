import {httpClient} from "../../../../common/http/core/http-client";
import {HttpMethod} from "../../../../common/http/core/http-method";
import {HttpRequest} from "../../../../common/http/core/http-request";
import {createAction} from "../../../../framework/action/action";
import { AuthPropertyValue, Property } from "../../../../framework/property/prop.model";
import * as mailchimp from "@mailchimp/mailchimp_marketing";


export const addMemberToList = createAction({
    name: 'add_member_to_list',
    displayName: "Add Member to List",
    description: "Add a member to an existing Mailchimp list",
    props: {
        authentication: Property.OAuth2({
            description: "",
            displayName: 'Authentication',
            authUrl: "https://login.mailchimp.com/oauth2/authorize",
            tokenUrl: "https://login.mailchimp.com/oauth2/token",
            required: true,
            scope: []
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email of the new contact',
            required: true,
        }),
        listId: Property.Dropdown<string>({
            displayName: "List",
            refreshers: ['authentication'],
            required: true,
            options: async (propsValue) => {
                if (propsValue['authentication'] === undefined) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: "Please select an authentication"
                    }
                }
                const authProp: AuthPropertyValue = propsValue['authentication'] as AuthPropertyValue;
                let lists =  (await getUserLists(authProp)).lists;
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
            
        }),
    },
    
    async run(context) {
        const access_token= context.propsValue.authentication?.access_token;
        const mailChimpMetaDataRequest: HttpRequest<{dc:string}> = {
            method: HttpMethod.GET,
            url: 'https://login.mailchimp.com/oauth2/metadata',
            headers: {
                Authorization: `OAuth ${access_token}`
              }
        };
        const mailChimpServerPrefix = (await httpClient.sendRequest(mailChimpMetaDataRequest)).dc;
        mailchimp.setConfig({
            accessToken: access_token,
            server: mailChimpServerPrefix
          });
        
       return await mailchimp.lists.addListMember(context.propsValue.listId!,{email_address:context.propsValue.email!, status:context.propsValue.status!})
    },
});
async function getUserLists(authProp: AuthPropertyValue): Promise<{lists:MailChimpList[]}> {
    const access_token= authProp.access_token;
    console.log(authProp);
        const mailChimpMetaDataRequest: HttpRequest<{dc:string}> = {
            method: HttpMethod.GET,
            url: 'https://login.mailchimp.com/oauth2/metadata',
            headers: {
                Authorization: `OAuth ${access_token}`
              }
        };
        const mailChimpServerPrefix = (await httpClient.sendRequest(mailChimpMetaDataRequest)).dc;
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