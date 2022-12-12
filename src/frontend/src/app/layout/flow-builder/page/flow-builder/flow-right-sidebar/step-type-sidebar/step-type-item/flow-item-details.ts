import { UUID } from 'angular2-uuid';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { ActionType } from '../../../../../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../../../../../common-layout/model/enum/trigger-type.enum';

export class FlowItemDetails {
	constructor(
		public type: ActionType | TriggerType,
		public name: string,
		public description: string,
		public logoUrl?: string,
		public extra?: {
			flowsVersionIds: UUID[];
			pieceVersionId: UUID;
			documentationUrl: string;
			scope: string;
			collectionConfigs: Config[];
			flowVersionIdToConfig: { id: UUID; configs: Config[]; displayName: string }[];
			old: boolean;
		}
	) {}
}
