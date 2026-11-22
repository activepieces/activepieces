import { frameRegisterTrigger } from './register-trigger';

export const triggers = [
  {
    name: 'project_created',
    eventType: 'project.created',
    displayName: 'New Project',
    description: 'Fires when a project is created in the selected team.',
    sampleData: {
      type: 'project.created',
      resource: {
        type: 'project',
        id: '405d8375-3514-403b-8c43-83ae74cfe0e9',
      },
      account: { id: '449e7a5c-69d3-4b8a-aaaf-5c9b713ebc65' },
      team: { id: '810007d0-bec5-486c-b5d1-28fcd8a079ba' },
      user: { id: '2b1f6a3e-7c1d-4e0a-9d52-3f6a8c9b1e47' },
      project: { id: '405d8375-3514-403b-8c43-83ae74cfe0e9' },
    },
  },
  {
    name: 'asset_created',
    eventType: 'asset.created',
    displayName: 'New Asset',
    description: 'Fires when a file or folder is added in the selected team.',
    sampleData: {
      type: 'asset.created',
      resource: {
        type: 'asset',
        id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
      },
      account: { id: '449e7a5c-69d3-4b8a-aaaf-5c9b713ebc65' },
      team: { id: '810007d0-bec5-486c-b5d1-28fcd8a079ba' },
      user: { id: '2b1f6a3e-7c1d-4e0a-9d52-3f6a8c9b1e47' },
      project: { id: '405d8375-3514-403b-8c43-83ae74cfe0e9' },
    },
  },
  {
    name: 'comment_created',
    eventType: 'comment.created',
    displayName: 'New Comment',
    description: 'Fires when someone comments on a file in the selected team.',
    sampleData: {
      type: 'comment.created',
      resource: {
        type: 'comment',
        id: 'c3d9f1a2-5b8e-4a67-8e01-7d4b2f9a6c35',
      },
      account: { id: '449e7a5c-69d3-4b8a-aaaf-5c9b713ebc65' },
      team: { id: '810007d0-bec5-486c-b5d1-28fcd8a079ba' },
      user: { id: '2b1f6a3e-7c1d-4e0a-9d52-3f6a8c9b1e47' },
      project: { id: '405d8375-3514-403b-8c43-83ae74cfe0e9' },
    },
  },
].map((props) => frameRegisterTrigger(props));
