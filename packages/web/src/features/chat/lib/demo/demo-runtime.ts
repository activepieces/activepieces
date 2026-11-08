import { chatDemo, DemoPlayTarget } from './chat-demo';
import { demoBackend } from './demo-backend';
import { demoCapabilities } from './demo-capability-scenarios';
import { demoScenarios } from './demo-scenarios';
import { playDemoScenario } from './play-scenario';

function subscribePlay(handler: (target: DemoPlayTarget) => void) {
  const off = chatDemo.onPlay(handler);
  const scenarioId = chatDemo.autoplayScenarioId;
  if (scenarioId && !autoplayed) {
    autoplayed = true;
    playDemoScenario(scenarioId);
  }
  return off;
}

let autoplayed = false;

export const demoRuntime = {
  chatDemo,
  demoBackend,
  demoCapabilities,
  demoScenarios,
  subscribePlay,
};
