import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newSection = createTrigger({
  auth: meistertaskAuth,
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created',
  props: {
    project: meisterTaskCommon.project,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 54321,
    name: 'To Do',
    project_id: 67890,
    sequence: 1,
    created_at: '2024-01-15T10:30:00Z',
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
      url: `${MEISTERTASK_API_URL}/projects/${context.propsValue.project}/sections`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    const newSections = response.body.filter((section: any) => {
      return section.created_at ;
    });
    
    await context.store.put('_last_checked', new Date().toISOString());
    return newSections;
  },
  
  async test(context) {
    const token = typeof context.auth === 'string' 
      ? context.auth 
      : (context.auth as any).access_token;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEISTERTASK_API_URL}/projects/${context.propsValue.project}/sections`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    return response.body.slice(0, 3);
  },
});
