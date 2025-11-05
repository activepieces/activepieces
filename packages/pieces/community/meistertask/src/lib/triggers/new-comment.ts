import { createTrigger } from "@activepieces/pieces-framework";
import { meisterTaskCommon, MEISTERTASK_API_URL } from "../common/common";
import { meistertaskAuth } from "../../index";
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export const newComment = createTrigger({
  auth: meistertaskAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 98765,
    text: 'This is a comment',
    task_id: 789,
    person_id: 12345,
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
    const newComments: any[] = [];
    
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
        const commentsResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/tasks/${task.id}/comments`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });
        
        const recentComments = commentsResponse.body.filter((comment: any) => {
          return comment.created_at;
        });
        
        newComments.push(...recentComments);
      } catch (error) {
        console.error(`Failed to fetch comments for task ${task.id}:`, error);
      }
    }
    
    await context.store.put('_last_checked', new Date().toISOString());
    return newComments;
  },
  
  async test(context) {
    return [this.sampleData];
  },
});