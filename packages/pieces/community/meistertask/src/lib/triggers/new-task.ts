import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newTask = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 789,
    name: 'Complete project documentation',
    notes: 'Need to add API documentation',
    section_id: 54321,
    assigned_to_id: 12345,
    status: 1,
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
      url: `${MEISTERTASK_API_URL}/sections/${context.propsValue.section}/tasks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    const newTasks = response.body.filter((task: any) => {
      return task.created_at;
    });
    
    await context.store.put('_last_checked', new Date().toISOString());
    return newTasks;
  },
  
  async test(context) {
    const token = typeof context.auth === 'string' 
      ? context.auth 
      : (context.auth as any).access_token;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEISTERTASK_API_URL}/sections/${context.propsValue.section}/tasks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    return response.body.slice(0, 3);
  },
});
