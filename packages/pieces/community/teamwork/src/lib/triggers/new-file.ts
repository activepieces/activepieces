import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newFileTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Fires when a new file is added to a project.',
  props: {
    project_id: teamworkProps.project_id(true), 
  },
  sampleData: {
    "project-id": "1",
    "filenameOnDisk": "githubFiesta.jpg",
    "can-upload-new-version": true,
    "uploaded-date": "2025-06-15T07:47:45Z",
    "read-comments-count": "0",
    "extraData": "",
    "private": "0",
    "version-id": "1",
    "userFollowingComments": false,
    "comments-count": "0",
    "status": "active",
    "changeFollowerIds": "",
    "tags": [],
    "version": "1",
    "id": "1",
    "last-changed-on": "2025-06-15T07:47:46Z",
    "commentFollowerIds": "",
    "shareable": true,
    "versions": [],
    "thumbURL": "",
    "uploaded-by-user-first-name": "Joe",
    "uploaded-by-user-last-name": "Font",
    "name": "hello.jpg",
    "uploaded-by-userId": "1",
    "userFollowingChanges": false,
    "description": "",
    "category-id": "",
    "originalName": "hello.jpg",
    "size": "1",
    "file-source": "1",
    "category-name": ""
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const files = await teamworkClient.getFiles(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('files', files);
  },
  async onDisable(context) {

  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

    const newFiles = await teamworkClient.getFiles(auth, projectId as string);
    

    let latestFiles = newFiles;
    if (lastCheckDate) {
        latestFiles = newFiles.filter(file => {
            return new Date(file['uploaded-date']) > new Date(lastCheckDate);
        });
    }


    if (latestFiles.length > 0) {
      await context.store.put('lastCheckDate', latestFiles[0]['uploaded-date']);
    }
    
    return latestFiles;
  },
});