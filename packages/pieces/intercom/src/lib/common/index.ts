import { Property } from "@activepieces/framework";

export const intercomCommon ={
    connection: Property.OAuth2({
        authUrl:'https://app.intercom.com/oauth',
        tokenUrl:'https://api.intercom.io/auth/eagle/token',    
        displayName:'Connection',
        required:true,
        scope:[]    
    }),
    
}