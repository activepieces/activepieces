import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newTaskLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a label is added to a task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    task_id: 789,
    task_name: 'Complete documentation',
    label_id: 22222,
    label_name: 'High Priority',
    created_at: '2024-01-15T10:30:00Z',
  },
  
  async onEnable(context) {
    await context.store.put('_known_task_labels', JSON.stringify({}));
  },
  
  async onDisable(context) {
    await context.store.delete('_known_task_labels');
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
    
    const newTaskLabels: any[] = [];
    const currentLabels: any = {};
    
    response.body.forEach((task: any) => {
      const taskLabels = task.labels || [];
      currentLabels[task.id] = taskLabels.map((l: any) => l.id);
      
    });
    
    await context.store.put('_known_task_labels', JSON.stringify(currentLabels));
    return newTaskLabels;
  },
  
  async test(context) {
    return [this.sampleData];
  },
});