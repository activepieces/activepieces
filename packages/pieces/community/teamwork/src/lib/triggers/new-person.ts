import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const newPersonTrigger = createTrigger({
  auth: teamworkAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Fires when a new person (user/contact) is added.',
  props: {
    project_id: teamworkProps.project_id(false),
  },
  sampleData: {
    "permissions": {
      "can-access-templates": false,
      "can-add-projects": false,
      "canManagePortfolio": false,
      "can-manage-people": false,
      "canAccessPortfolio": false
    },
    "avatar-url": "",
    "last-changed-on": "2024-08-09T14:21:19Z",
    "email-address": "testuser@example.com",
    "last-login": "",
    "address-country": "",
    "textFormat": "HTML",
    "user-name": "test.user",
    "id": "12345",
    "phone-number-fax": "",
    "site-owner": false,
    "address-city": "",
    "company-name": "MCG Company",
    "user-invited-date": "2024-06-14T14:07:29Z",
    "user-type": "collaborator",
    "first-name": "Test",
    "last-name": "User",
    "created-at": "2024-06-14T14:07:29Z",
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const auth = context.auth as TeamworkAuth;
    const projectId = context.propsValue.project_id;
    const people = await teamworkClient.getPeople(auth, projectId as string);
    await context.store.put('lastCheckDate', new Date().toISOString());
    await context.store.put('people', people);
  },
  async onDisable(context) {

  },
  async run(context) {
    const auth = context.auth as TeamworkAuth;
    const lastCheckDate = await context.store.get<string>('lastCheckDate');
    const projectId = context.propsValue.project_id;

     const newPeople = await teamworkClient.getPeople(auth, projectId as string);
    

    let latestPeople = newPeople;
    if (lastCheckDate) {
        latestPeople = newPeople.filter(person => {

            return new Date(person['created-at']) > new Date(lastCheckDate);
        });
    }


    if (latestPeople.length > 0) {
      await context.store.put('lastCheckDate', latestPeople[0]['created-at']);
    }
    
    return latestPeople;
  },
});