import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const CreateTask = createAction({
    name: 'CreateTask',
    displayName: 'Create Invoice Ninja Task',
    description: 'Creates a task instance in Invoice Ninja for billing purposes.',

    props: {
        number: Property.LongText({
            displayName: 'Task or Ticket Number (alphanumeric)',
            description: 'A unique task or ticket number that has not been used before in Invoice Ninja',
            required: true,
        }),
        client_id: Property.LongText({
            displayName: 'Client ID (alphanumeric)',
            description: 'Client ID from Invoice Ninja (optional)',
            required: false,
        }),
        project_id: Property.LongText({
            displayName: 'Project ID (alphanumeric)',
            description: 'Project ID from Invoice Ninja (optional)',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description of task',
            description: 'Description of task to be billed',
            required: true,
        }),
        rate: Property.Number({
            displayName: 'Custom hourly rate',
            description: 'Custom hourly rate (optional) otherwise default used',
            required: false,
        }),
        authentication:Property.CustomAuth({
            displayName: 'Custom Authentication',
            description: 'Enter custom authentication details',
            props: {
                base_url: Property.ShortText({
                    displayName: 'Base URL',
                    description: 'Enter the base URL',
                    required: true,
                }),
                access_token: Property.LongText({
                    displayName: 'API Token',
                    description: 'Enter the API token',
                    required: true,
                })
            },
            required: true
        })
},

async run(context) { 
    //const url = context.propsValue.authentication.base_url + '/api/v1/tasks/';
    const INapiToken = context.propsValue.authentication.access_token;
  
    const headers = {
      //'Content-Type': 'application/json',
      'X-Api-Token': INapiToken,
    };
  
    const queryParams = new URLSearchParams();
        queryParams.append('number', context.propsValue.number || '');
        queryParams.append('client_id', context.propsValue.client_id || '');
        queryParams.append('project_id', context.propsValue.project_id || '');
        queryParams.append('description', context.propsValue.description || '');
        queryParams.append('rate', context.propsValue.rate?.toString() || '');
    
    const url = `${context.propsValue.authentication.base_url}/api/v1/tasks?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.POST,
      url,
      headers,
    };

    try {
        //const response = await httpClient.sendRequest<any[]>(httprequestdata);
        //const response = await httpClient.sendRequest<TaskResponse[]>(httprequestdata);
        //return response.body;
        const response = await httpClient.sendRequest(httprequestdata);
        return response.body;
      } catch (error) {
        const errorMessage = (error as Error).message || 'Unknown error occurred';
        throw new Error(`Error: ${errorMessage}`);
      }
 
    }
})