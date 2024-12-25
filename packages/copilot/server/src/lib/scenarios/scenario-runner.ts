import { FlowType } from '../types/flow-outline';
import { Agent } from '../types/agent';
import { scenarios } from '.';
import { isNil } from '@activepieces/shared';
import { WebsocketEventTypes } from '@activepieces/copilot-shared';
import { Socket } from 'socket.io';
import { websocketUtils } from '../util/websocket';

export async function runScenarios(agent: Agent<FlowType>, targetScenario: string[] | null, socket: Socket | null) {

  const scenariosToRun = scenarios.filter((scenario) =>
    targetScenario?.includes(scenario.title) || isNil(targetScenario)
  );

  for (const scenario of scenariosToRun) {
    await websocketUtils.updateTestState(socket, scenario.title, 'running');

    const output = await agent.plan(scenario.prompt(), socket);

    const result = {
      prompt: scenario.prompt(),
      output: output,
    };
    await websocketUtils.updateTestState(socket, scenario.title, 'stopped');

    // Emit test result through the agent's callback
    websocketUtils.addResult(socket, {
      type: WebsocketEventTypes.SCENARIO_COMPLETED,
      data: {
        title: scenario.title,
        ...result,
        timestamp: new Date().toISOString(),
      }
    });
  }
}



