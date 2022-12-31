// TODO REMOVENOW
/**import { UUID } from 'angular2-uuid';

export class ArtifactCacheKey {
	protected _prefix: ArtifactCachKeyPrefix;

	constructor(private _value: string) {}
	public toString = () => {
		return `${this._prefix}|${this._value}`;
	};
}

export class StepCacheKey extends ArtifactCacheKey {
	constructor(flowId: UUID, stepName: string) {
		super(`${flowId.toString()}.${stepName}`);
		this._prefix = ArtifactCachKeyPrefix.STEP;
	}
	static getStepName(stepCacheKey: string) {
		const splitPrefixAndValue = stepCacheKey.split('|');
		const value = splitPrefixAndValue[1];
		const stepName = value.split('.')[1];
		return stepName;
	}
}
enum ArtifactCachKeyPrefix {
	FLOW_CONFIG = 'flow.config',
	COLLECTION_CONFIG = 'collection.config',
	STEP = 'flow.step',
}
**/