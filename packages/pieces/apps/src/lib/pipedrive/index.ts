import { createPiece } from '@activepieces/framework';
import { addPerson } from './actions/add-person.action/add-person.action'
import { newPerson } from './trigger/new-person'
import { newDeal } from './trigger/new-deal'
import { newActivity } from './trigger/new-activity'
import { updatedPerson } from './trigger/updated-person'
import { updatedDeal } from './trigger/updated-deal'

export const pipedrive = createPiece({
	name: 'pipedrive',
	displayName: "Pipedrive",
	logoUrl: 'https://cdn.activepieces.com/pieces/pipedrive.png',
  version: '0.0.0',
	actions: [addPerson],
	authors: ['ashrafsamhouri'],
	triggers: [newPerson, newDeal, newActivity, updatedPerson, updatedDeal],
});
