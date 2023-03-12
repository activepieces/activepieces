import { AuthenticationType, createAction, getAccessTokenOrThrow, httpClient, HttpError, HttpMethod, HttpResponse, Property } from "@activepieces/framework";
import { intercomCommon } from "../common";

enum ContactRole
{
  USER="user",
  LEAD="lead"
}
export const getOrCreateContact= createAction({
    description:'Get or create a contact (ie. user or lead) if it isn\'t found',
    displayName:"Get or Create Contact",
    name:"get_or_create_contact_intercom",
    sampleData:{
        "type": "contact",
        "id": "6409ae25be4bf93b73d32f17",
        "workspace_id": "yo3vjfq2",
        "external_id": "xzww123123gg33",
        "role": "user",
        "email": "zxcvzxcvgg313",
        "phone": null,
        "name": null,
        "avatar": null,
        "owner_id": null,
        "social_profiles": {
          "type": "list",
          "data": []
        },
        "has_hard_bounced": false,
        "marked_email_as_spam": false,
        "unsubscribed_from_emails": false,
        "created_at": 1678356005,
        "updated_at": 1678356005,
        "signed_up_at": 1678356004,
        "last_seen_at": null,
        "last_replied_at": null,
        "last_contacted_at": null,
        "last_email_opened_at": null,
        "last_email_clicked_at": null,
        "language_override": null,
        "browser": null,
        "browser_version": null,
        "browser_language": null,
        "os": null,
        "location": {
          "type": "location",
          "country": null,
          "region": null,
          "city": null,
          "country_code": null,
          "continent_code": null
        },
        "android_app_name": null,
        "android_app_version": null,
        "android_device": null,
        "android_os_version": null,
        "android_sdk_version": null,
        "android_last_seen_at": null,
        "ios_app_name": null,
        "ios_app_version": null,
        "ios_device": null,
        "ios_os_version": null,
        "ios_sdk_version": null,
        "ios_last_seen_at": null,
        "custom_attributes": {},
        "tags": {
          "type": "list",
          "data": [],
          "url": "/contacts/6409ae25be4bf93b73d32f17/tags",
          "total_count": 0,
          "has_more": false
        },
        "notes": {
          "type": "list",
          "data": [],
          "url": "/contacts/6409ae25be4bf93b73d32f17/notes",
          "total_count": 0,
          "has_more": false
        },
        "companies": {
          "type": "list",
          "data": [],
          "url": "/contacts/6409ae25be4bf93b73d32f17/companies",
          "total_count": 0,
          "has_more": false
        },
        "opted_out_subscription_types": {
          "type": "list",
          "data": [],
          "url": "/contacts/6409ae25be4bf93b73d32f17/subscriptions",
          "total_count": 0,
          "has_more": false
        },
        "opted_in_subscription_types": {
          "type": "list",
          "data": [],
          "url": "/contacts/6409ae25be4bf93b73d32f17/subscriptions",
          "total_count": 0,
          "has_more": false
        },
        "utm_campaign": null,
        "utm_content": null,
        "utm_medium": null,
        "utm_source": null,
        "utm_term": null,
        "referrer": null,
        "sms_consent": false,
        "unsubscribed_from_sms": false
      },
    props:{
        connection: intercomCommon.connection,
        role:Property.StaticDropdown({
            displayName:"Role",
            required:true,
            options:{
                options:[{label:"User",value:ContactRole.USER}, {label:"Lead", value:ContactRole.LEAD}]
            },
            defaultValue:ContactRole.USER
        }),
        email:Property.ShortText({
            displayName:"Email",
            required:true
        }),
        externalId:Property.ShortText({
            displayName:"External Id",
            required: false
        }),
        name:Property.ShortText({
            displayName:'Name',
            required:false,
        }),
        phone:Property.ShortText({
            displayName:'Phone',
            required:false,
        }),
        avatar:Property.ShortText({
            displayName:"Avatar Url",
            required:false,
            description:"An image URL containing the avatar of a contact"
        }),
        customAttributes: Property.Object({
            displayName:"Custom Attributes",
            required:false
        }),
        
    },
    run:async(context)=>{
        const authentication = getAccessTokenOrThrow(context.propsValue.connection);
        try{
            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `https://api.intercom.io/contacts`,
                headers:intercomCommon.intercomHeaders,
                authentication: {
                  type: AuthenticationType.BEARER_TOKEN,
                  token: (authentication as string)
                },
                body:
                {
                    role:context.propsValue.role,
                    external_id:context.propsValue.externalId,
                    email:context.propsValue.email,
                    name:context.propsValue.name,
                    phone:context.propsValue.phone,
                    avatar:context.propsValue.avatar,
                    custom_attributes:context.propsValue.customAttributes,
                    signed_up_at:new Date()
                }
              });
              return response.body;
        }
        catch(ex:any)
        {   
            //check if it is failed because the user exists
            const response:HttpResponse = (JSON.parse(ex.message)).response;
            if(response && response.body)
            {
                const errors = response.body['errors'];
                if(Array.isArray(errors) && errors[0])
                {
                    const idFromErrorMessage= errors[0].message?.split('id=')[1];
                    if(idFromErrorMessage)
                    {
                        return intercomCommon.getContact({userId:idFromErrorMessage,token:authentication})
                    }
                }
            }
            throw ex;
        }       
    }
})