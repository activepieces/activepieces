import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";



export const newProject = createTrigger({
  auth: meistertaskAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 67890,
    name: 'New Project',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  
  async onEnable(context) {
    await context.store.put('_last_checked', new Date().toISOString());
  },
  
  async onDisable(context) {
    await context.store.delete('_last_checked');
  },
  
  async run(context) {
    const token = typeof context.auth === 'string' 
      ? context.auth 
      : (context.auth as any).access_token;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEISTERTASK_API_URL}/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    const newProjects = response.body.filter((project: any) => {
      return project.created_at;
    });
    
    await context.store.put('_last_checked', new Date().toISOString());
    return newProjects;
  },
  
  async test(context) {
    const token = typeof context.auth === 'string' 
      ? context.auth 
      : (context.auth as any).access_token;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEISTERTASK_API_URL}/projects`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    return response.body.slice(0, 3);
  },
});
