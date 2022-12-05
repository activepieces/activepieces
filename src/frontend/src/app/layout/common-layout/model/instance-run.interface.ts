import { UUID } from 'angular2-uuid';
import { ActionStatus } from './enum/action-status';
import { InstanceRunStatus } from './enum/instance-run-status';

export interface InstanceRun {
	id: UUID;
	environmentId: UUID;
	accountId: UUID;
	instanceId: UUID;
	flowVersionId: UUID;
	status: InstanceRunStatus;
	state: InstanceRunState;
	stateUrl?: string;
	logsUploaded: boolean;
	epochFinishTime: number;
	epochStartTime: number;
	pieceDisplayName?: string;
	accountName?: string;
	flowDisplayName: string;
}

export interface InstanceRunState {
	variables: any;
	steps: { [key: string]: StepResult };
}

export interface LoopStepOutput extends StepResult {
	output: {
		current_item: any;
		current_iteration: number;
		iterations: { [key: string]: StepResult }[];
	};
}

export interface StepResult {
	duration: number;
	status: ActionStatus;
	timeInSeconds: number;
	standardOutput: any;
	input: Object;
	output: any;
	errorMessage: string;
}

export const initializedRun: InstanceRun = {
	id: '',
	environmentId: '',
	accountId: '',
	flowVersionId: '',
	logsUploaded: false,
	status: InstanceRunStatus.RUNNING,
	epochFinishTime: 0,
	epochStartTime: 0,
	flowDisplayName: '',
	instanceId: '',
	state: { steps: {}, variables: null },
};
