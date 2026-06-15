import { createAction, Property } from "@activepieces/pieces-framework";
import { jiraCloudAuth } from "../../auth";
import { jiraApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const findUserAction = createAction({
    auth:jiraCloudAuth,
    name:'find-user',
    displayName:'Find User',
    description:'Finds an existing user.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search Jira users by a keyword matched against display name and email, returning all matches plus a found flag. Use to resolve a person\'s name or email into a Jira accountId before assigning issues or adding watchers. Read-only and idempotent.',
        idempotent: true,
    },
    props:{
        keyword:Property.ShortText({
            displayName:'Keyword',
            required:true,
        })
    },
    async run(context){
        const response = await jiraApiCall<Array<Record<string,any>>>({
            auth:context.auth,
            method:HttpMethod.GET,
            resourceUri:'/user/search',
            query:{
                query:context.propsValue.keyword
            }
        })

        return{
            found:response.length>0,
            data:response
        }
    }
})