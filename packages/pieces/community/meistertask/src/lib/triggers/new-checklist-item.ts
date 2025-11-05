import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newChecklistItem = createTrigger({
  auth: meistertaskAuth,
  name: 'new_checklist_item',
  displayName: 'New Checklist Item',
  description: 'Triggers when a checklist item is added to a task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 33333,
    name: 'Review document',
    status: 0,
    task_id: 789,
    created_at: '2024-01-15T10:30:00Z',
  },
  
  async onEnable(context) {
    await context.store.put('_known_checklist_items', JSON.stringify({}));
  },
  
  async onDisable(context) {
    await context.store.delete('_known_checklist_items');
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
    
    const newChecklistItems: any[] = [];
    const currentItems: any = {};
    
    response.body.forEach((task: any) => {
      const checklistItems = task.checklist_items || [];
      currentItems[task.id] = checklistItems.map((i: any) => i.id);
      
      
    });
    
    await context.store.put('_known_checklist_items', JSON.stringify(currentItems));
    return newChecklistItems;
  },
  
  async test(context) {
    return [this.sampleData];
  },
});