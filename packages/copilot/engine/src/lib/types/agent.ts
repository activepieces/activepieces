interface Agent<OUTPUT> {
  plan(prompt: string): Promise<OUTPUT>;
}
