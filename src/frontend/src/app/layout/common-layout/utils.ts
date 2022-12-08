import { ActionType } from './model/enum/action-type.enum';
import { TriggerType } from './model/enum/trigger-type.enum';
import { Flow } from './model/flow.class';

export function getDisplayNameForTrigger(triggerType: TriggerType) {
	switch (triggerType) {
		case TriggerType.EVENT: {
			return 'Event Trigger';
		}
		case TriggerType.WEBHOOK: {
			return 'Webhook Trigger';
			break;
		}
		case TriggerType.COLLECTION_DEPLOYED: {
			return 'Collection Deployed';
			break;
		}
		case TriggerType.COLLECTION_STOPPED: {
			return 'Collection Stopped';
			break;
		}
		case TriggerType.SCHEDULE: {
			return 'Schedule Trigger';
		}
		case TriggerType.EMPTY: {
			return 'Empty Trigger';
		}
	}
	return 'Trigger';
}

export function getDefaultDisplayNameForPiece(pieceType: ActionType, pieceName: string) {
	switch (pieceType) {
		case ActionType.BRANCH: {
			return 'Branch';
		}
		case ActionType.CODE: {
			return 'Code';
		}
		case ActionType.STORAGE: {
			return 'Storage';
		}
		case ActionType.LOOP_ON_ITEMS: {
			return 'Loop on Items';
		}
		case ActionType.RESPONSE: {
			return 'Response';
		}
		case ActionType.COMPONENT: {
			return 'Component';
		}
	}
	return 'Trigger';
}

export function isOfTypeTriggerType(value: string) {
	const enumHolderObject = Object.keys(TriggerType);
	return enumHolderObject.includes(value);
}

export function findDefaultFlowDisplayName(flows: Flow[]) {
	let defaultFlowIndex = 1;

	while (flows.find(f => f.last_version.display_name.toLowerCase() == `flow ${defaultFlowIndex}`)) {
		defaultFlowIndex++;
	}
	return `Flow ${defaultFlowIndex}`;
}

export const defaultCronJobForScheduleTrigger = '0 */5 * ? * *';

export const autoSaveDebounceTime = 600;
export const cacheArtifactDebounceTime = 200;
