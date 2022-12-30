import { Action } from './action.interface';
import { StorageOperation } from './storage-operation.enum';
import { StorageScope } from './storage-scope.enum';

export interface StorageAction extends Action {
	settings: {
		operation: StorageOperation;
		key: string;
		value: string;
		scope: StorageScope;
	};
}
