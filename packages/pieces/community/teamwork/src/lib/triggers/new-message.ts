import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newMessageTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Fires when a new message is posted (in project messages or discussions).',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "user-display-posted-time": "6:01PM",
    "project-id": "999",
    "author-first-name": "Demo",
    "attachments-count": "0",
    "milestone-id": "",
    "isRead": "1",
    "private": "0",
    "comments-count": "0",
    "author-avatar-url": "https://s3.amazonaws.com/TWFiles/2/users/999.avatar",
    "category-id": "",
    "author-last-name": "User",
    "posted-on": "2024-03-31T18:01:17Z",
    "body": "Yet another message content goes here",
    "id": "999",
    "last-changed-on": "2024-03-31T18:01:17Z",
    "content-type": "TEXT",
    "last-comment-date": "2024-03-31T18:01:17Z",
    "user-display-posted-date": "Mon, 31 Mar 2024",
    "author-id": "999",
    "title": "Yet another task for tomorrow",
    "category-name": ""
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const messages = await teamworkClient.getMessages(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('messages', messages);
  },
  async onDisable(context) {

  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

    const newMessages = await teamworkClient.getMessages(auth, projectId as string);
    

    let latestMessages = newMessages;
    if (lastCheckDate) {
        latestMessages = newMessages.filter(message => {
            return new Date(message['posted-on']) > new Date(lastCheckDate);
        });
    }


    if (latestMessages.length > 0) {
      await context.store.put('lastCheckDate', latestMessages[0]['posted-on']);
    }
    
    return latestMessages;
  },
});