import { chatDemo } from './chat-demo';
import { demoBackend } from './demo-backend';

// Starts a scenario: the chat panel listens (chatDemo.onPlay) and opens it.
export function playDemoScenario(scenarioId: string): void {
  const target = demoBackend.prepare(scenarioId);
  if (!target) return;
  chatDemo.setLastScenario(scenarioId);
  chatDemo.requestPlay(target);
}
