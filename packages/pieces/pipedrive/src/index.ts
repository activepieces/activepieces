import { createPiece } from '@activepieces/framework';
import { addPerson } from './lib/actions/add-person.action/add-person.action'
import { newPerson } from './lib/trigger/new-person'
import { newDeal } from './lib/trigger/new-deal'
import { newActivity } from './lib/trigger/new-activity'
import { updatedPerson } from './lib/trigger/updated-person'
import { updatedDeal } from './lib/trigger/updated-deal'

export const pipedrive = createPiece({
	name: 'pipedrive',
	displayName: "Pipedrive",
	logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
  version: '0.0.0',
	actions: [addPerson],
	authors: ['ashrafsamhouri'],
	triggers: [newPerson, newDeal, newActivity, updatedPerson, updatedDeal],
});
