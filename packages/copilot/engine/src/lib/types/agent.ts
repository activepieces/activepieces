export interface Agent<o> {
  plan(prompt: string): Promise<o>;
  onTestResult?: (result: any) => void;
}
