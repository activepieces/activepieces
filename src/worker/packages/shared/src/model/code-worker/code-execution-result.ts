import {CodeRunStatus} from "./code-run-status";

export interface CodeExecutionResult {
    verdict: CodeRunStatus,
    timeInSeconds: number,
    standardOutput: string
    standardError: string,
    output: unknown,
}