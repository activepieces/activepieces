
type ScenarioResult = {
    success: boolean;
    message: string;
}

export interface Scenario<OUTPUT> {
    title: string;

    scenario(): string;

    eval(flowOutline: OUTPUT): ScenarioResult;

}