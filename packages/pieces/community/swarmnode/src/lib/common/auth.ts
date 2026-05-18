import { PieceAuth } from "@activepieces/pieces-framework";
import {AuthenticationType, httpClient, HttpMethod} from "@activepieces/pieces-common";
import { BASE_URL } from "./constants";

export const swarmnodeAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain your API key from [Settings](https://app.swarmnode.ai/settings/api-keys/).`,
    validate:async ({auth})=>{
        try{
            await httpClient.sendRequest({
                method:HttpMethod.GET,
                url: BASE_URL + '/agents/',
                authentication:{
                    type:AuthenticationType.BEARER_TOKEN,
                    token:auth
                }
            })

            return {
                valid:true
            }
        }
        catch{
            return{
                valid:false,
                error:'Invalid API Key.'
            }
        }
    }
})