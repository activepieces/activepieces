
import { ActionType, Flow, TriggerType } from 'shared';


export function getDisplayNameForTrigger(triggerType: TriggerType) {
	switch (triggerType) {
		case TriggerType.WEBHOOK: {
			return 'Webhook Trigger';
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
		case ActionType.CODE: {
			return 'Code';
		}
		case ActionType.STORAGE: {
			return 'Storage';
		}
		case ActionType.LOOP_ON_ITEMS: {
			return 'Loop on Items';
		}
		case ActionType.PIECE: {
			return 'Component';
		}
	}
}

export function isOfTypeTriggerType(value: string) {
	const enumHolderObject = Object.keys(TriggerType);
	return enumHolderObject.includes(value);
}

export function findDefaultFlowDisplayName(flows: Flow[]) {
	let defaultFlowIndex = 1;

	while (flows.find(f => f.version?.displayName.toLowerCase() == `flow ${defaultFlowIndex}`)) {
		defaultFlowIndex++;
	}
	return `Flow ${defaultFlowIndex}`;
}

export const defaultCronJobForScheduleTrigger = '0 */5 * ? * *';

export const autoSaveDebounceTime = 600;
export const cacheArtifactDebounceTime = 200;
