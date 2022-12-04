import { Action } from './action.interface';

export interface ResponseAction extends Action {
	settings: {
		//this is a dictionary
		output: { [key: string]: any };
	};
}
