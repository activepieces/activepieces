export interface CodeTestExecutionResult {
	duration: number;
	input: any;
	output: any;
	errorMessage: string;
	standardOutput: string;
	status: string;
	timeInSeconds: string;
	verdict: string;
}
