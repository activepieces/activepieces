import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newAttachment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_attachment',
  displayName: 'New Attachment',
  description: 'Triggers when an attachment is created',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 123456,
    name: 'document.pdf',
    url: 'https://example.com/document.pdf',
    task_id: 789,
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
    
    const newAttachments: any[] = [];
    
    const tasksResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${MEISTERTASK_API_URL}/sections/${context.propsValue.section}/tasks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token,
      },
    });
    
    for (const task of tasksResponse.body) {
      try {
        const attachmentsResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/tasks/${task.id}/attachments`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });
        
        const recentAttachments = attachmentsResponse.body.filter((att: any) => {
          return att.created_at;
        });
        
        newAttachments.push(...recentAttachments);
      } catch (error) {
        console.error(`Failed to fetch attachments for task ${task.id}:`, error);
      }
    }
    
    await context.store.put('_last_checked', new Date().toISOString());
    return newAttachments;
  },
  
  async test(context) {
    return [this.sampleData];
  },
});