import { FlowItemDetails } from './flow-item-details';
import { ActionType } from '../../../../../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../../../../../common-layout/model/enum/trigger-type.enum';
type PackageDetails = {
	name: string;
	version: string;
};

export class ComponentItemDetails extends FlowItemDetails {
	public readonly package: PackageDetails;

	public readonly version: string;

	public readonly manifestUrl: string;

	constructor(obj: {
		type: ActionType | TriggerType;
		name: string;
		description: string;
		version: string;
		manifest: string;
		logoUrl: string;
		package: PackageDetails;
	}) {
		super(obj.type, obj.name, obj.description, obj.logoUrl, undefined);
		this.package = obj.package;
		this.version = obj.version;
		this.manifestUrl = obj.manifest;
	}
}
