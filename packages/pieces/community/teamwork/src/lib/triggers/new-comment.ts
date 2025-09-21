import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newCommentTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Fires when a new comment is posted.',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "project-id": "999",
    "attachments_count": "0",
    "author-lastname": "User",
    "commentable-id": "999",
    "commentable_type": "todo_items",
    "emailed-from": "",
    "isRead": "1",
    "private": "0",
    "lockdown-id": "",
    "datetime": "2024-09-22T13:03:29Z",
    "author-avatar-url": "https://s3.amazonaws.com/TWFiles/2/users/999.avatar",
    "author_id": "999",
    "id": "999",
    "company-name": "Demo 1 Company",
    "last-changed-on": "",
    "content-type": "HTML",
    "nr-notified-people": "0",
    "type": "task",
    "item-name": "Test Task",
    "attachments-count": "0",
    "company-id": "999",
    "html-body": "A test comment",
    "project-name": "demo",
    "body": "A test comment",
    "attachments": [],
    "author-firstname": "Demo",
    "comment-link": "tasks/436523?c=93",
    "author-id": "999"
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const queryParams: Record<string, any> = {};

    if (projectId) {
      queryParams['projectIds'] = projectId;
    }

    const comments = await teamworkClient.getComments(auth, queryParams);
    context.store.put('lastCheckDate', new Date().toISOString());
    context.store.put('comments', comments);
  },
  async onDisable(context) {
  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string | undefined>('lastCheckDate'); // Use type assertion to help TypeScript
    const projectId = context.propsValue.project_id;

    const queryParams: Record<string, any> = {
      orderBy: 'date',
      sortOrder: 'desc',
      pageSize: 100,
    };
    if (projectId) {
      queryParams['projectIds'] = projectId;
    }

    const newComments = await teamworkClient.getComments(auth, queryParams);
    
    let latestComments = newComments;


    if (lastCheckDate) {
        latestComments = newComments.filter(comment => {
            return new Date(comment.datetime) > new Date(lastCheckDate);
        });
    }

    if(newComments.length > 0) {
      context.store.put('lastCheckDate', newComments[0].datetime);
    }
    
    return latestComments;
  },
});