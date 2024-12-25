export interface Scenario<OUTPUT> {
  title: string;

  prompt(): string;
}
