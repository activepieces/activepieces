import { createAction, Property } from "@activepieces/pieces-framework";
import { jiraCloudAuth } from "../../auth";
import { jiraApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const findUserAction = createAction({
    auth:jiraCloudAuth,
    name:'find-user',
    displayName:'Find User',
    description:'Finds an existing user.',
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