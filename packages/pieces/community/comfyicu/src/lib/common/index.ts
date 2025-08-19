import {
  HttpMethod,
  QueryParams,
  httpClient,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export async function comfyIcuApiCall({
  apiKey,
  endpoint,
  method,
  qparams,
  body,
}: {
  apiKey: string;
  endpoint: string;
  method: HttpMethod;
  qparams?: QueryParams;
  body?: any;
}) {
  const request: HttpRequest = {
    url: `https://comfy.icu/api/v1${endpoint}`,
    method,
    queryParams: qparams,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
  };

  const response = await httpClient.sendRequest(request);
  return response;
}

export const commonProps = {
    workflow_id:Property.Dropdown({
        displayName:'Workflow ID',
        refreshers:[],
        required:true,
        options:async ({auth})=>{
            if(!auth)
            {
                return{
                    disabled:true,
                    options:[],
                    placeholder:'Please connect your account first.'
                }
            }

            const response = await comfyIcuApiCall({
                apiKey:auth as string,
                endpoint:'/workflows',
                method:HttpMethod.GET
            })

            const workflows = response.body as {id:string,name:string}[];

            return {
                disabled:false,
                options:workflows.map((workflow)=>{
                    return{
                        label:workflow.name,
                        value:workflow.id
                    }
                })
            }
        }
    }),
    run_id:Property.ShortText({
        displayName:'Run ID',
        required:true
    })
}