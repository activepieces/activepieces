import { moxieCRMRegisterTrigger } from './register-trigger';
export const enum MoxieCRMEventType {
  CLIENT_CREATED = 'ClientCreate',
  CLEINT_UPDATED = 'ClientUpdate',
  CLIENT_DELETED = 'ClientDelete',
}

export const moxieCRMTriggers = [
  {
    name: 'client_created',
    displayName: 'Client Created',
    description: 'Triggerd when a new client is created.',
    eventType: MoxieCRMEventType.CLIENT_CREATED,
  },
  {
    name: 'client_updated',
    displayName: 'Client Updated',
    description: 'Triggerd when an existing client is updated.',
    eventType: MoxieCRMEventType.CLEINT_UPDATED,
  },
  {
    name: 'client_deleted',
    displayName: 'Client Deleted',
    description: 'Triggerd when an existing client is Deleted.',
    eventType: MoxieCRMEventType.CLIENT_DELETED,
  },
].map((props) => moxieCRMRegisterTrigger(props));
