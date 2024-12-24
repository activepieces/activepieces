type ScenarioResult = {
  success: boolean;
  message: string;
};

export interface Scenario<OUTPUT> {
  title: string;

  prompt(): string;
}
