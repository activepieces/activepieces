export interface CodeTestExecutionResult {
	duration: number;
	input: any;
	output: any;
	error_message: string;
	standard_output: string;
	status: string;
	time_in_seconds: string;
	verdict: string;
}
