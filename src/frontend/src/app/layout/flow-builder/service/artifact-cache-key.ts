import { UUID } from 'angular2-uuid';

export class ArtifactCacheKey {
	protected _prefix: ArtifactCachKeyPrefix;

	constructor(private _value: string) {}
	public toString = () => {
		return `${this._prefix}|${this._value}`;
	};
}

export class FlowConfigsCacheKey extends ArtifactCacheKey {
	constructor(flowId: UUID, configKey: string) {
		super(`${flowId.toString()}.${configKey}`);
		this._prefix = ArtifactCachKeyPrefix.FLOW_CONFIG;
	}
	static getConfigKey(flowConfigCacheKey: string) {
		const splitPrefixAndValue = flowConfigCacheKey.split('|');
		const value = splitPrefixAndValue[1];
		const configKey = value.split('.')[1];
		return configKey;
	}
}
export class CollectionConfigsCacheKey extends ArtifactCacheKey {
	constructor(collectionId: UUID, configKey: string) {
		super(`${collectionId.toString()}.${configKey}`);
		this._prefix = ArtifactCachKeyPrefix.COLLECTION_CONFIG;
	}

	static getConfigKey(flowConfigCacheKey: string) {
		const splitPrefixAndValue = flowConfigCacheKey.split('|');
		const value = splitPrefixAndValue[1];
		const configKey = value.split('.')[1];
		return configKey;
	}
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
