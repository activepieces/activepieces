import { ActionStatus } from './enum/action-status';
import { InstanceRunStatus } from './enum/instance-run-status';

export interface InstanceRun {
	id: string;
	flow_version_id: string;
	status: InstanceRunStatus;
	logs_file_id: string;
	start_time: number;
	finish_time: number;
	collection_display_name: string;
	flow_display_name: string;
	state: InstanceRunState;
}

export interface InstanceRunState {
	configs: any;
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
	time_in_seconds: number;
	standard_output: any;
	input: Object;
	output: any;
	error_message: string;
}

export const initializedRun: InstanceRun = {
	id: '',
	flow_version_id: '',
	status: InstanceRunStatus.RUNNING,
	logs_file_id: '',
	start_time: 0,
	finish_time: 0,
	collection_display_name: '',
	flow_display_name: '',
	state: { configs: {}, steps: {} },
};
