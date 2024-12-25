import { Scenario } from './scenario';
import { FlowType } from '../types/flow-outline';
import { Agent } from '../agents/agent';
import { isNil } from '@activepieces/shared';
import { WebsocketCopilotUpdate, RunTestsParams } from '@activepieces/copilot-shared';
import { Socket } from 'socket.io';
import { websocketUtils } from '../util/websocket';

export const scenarios: Scenario<FlowType>[] = [
  {
    title: 'New Row Google Sheets Send Slack Message',
    prompt: 'When a new row is added to a Google Sheets spreadsheet, send a message to a Slack channel.',
  },
  {
    title: 'Google Sheets to Airtable with Value Check',
    prompt: 'Read from a Google Sheet and insert values larger than 100 to Airtable, otherwise send a failure email.',
  },
  {
    title: 'Alternating Discord and Slack Messages',
    prompt: 'Every 10 hours, send a discord message or a slack message alternatively.',
  },
  {
    title: 'Regular Discord Message',
    prompt: 'Send a regular discord message every 2 minutes.',
  },
  {
    title: 'Stripe Customer Poems to WordPress',
    prompt: 'Write poems about new stripe customers and post them as wordpress posts.',
  },
  {
    title: 'Failed Stripe Payment Notifications',
    prompt: 'Receive slack notifications about stripe payments when they don\'t go through.',
  },
  {
    title: 'Sheets to Blog AI',
    prompt: 'Use ChatGPT to write blog posts from ideas in a Google Sheet and send an email notification once it\'s done.',
  },
  {
    title: 'Hubspot Mailchimp Sync',
    prompt: 'Sync new HubSpot contacts to Mailchimp.',
  },
  {
    title: 'Shopify Customer Tagging',
    prompt: `when a new shopify customer come,send a welcome email to the customer.if customer name contains 'test',then add  'test' tag to the customer,else add 'vip' tag to the customer`,
  },
];

export async function runScenarios(agent: Agent<FlowType>, targetScenario: RunTestsParams[] | null, socket: Socket | null) {
  const scenariosToRun = scenarios.filter((scenario) =>
    targetScenario?.some(ts => ts.scenarioTitle === scenario.title) || isNil(targetScenario)
  );

  for (const scenario of scenariosToRun) {
    await websocketUtils.updateTestState(socket, scenario.title, 'running');

    const testParams = targetScenario?.find(ts => ts.scenarioTitle === scenario.title);
    const output = await agent.plan(scenario.prompt, socket, {
      relevanceThreshold: testParams?.relevanceThreshold,
    });

    const result = {
      prompt: scenario.prompt,
      output: output,
    };
    await websocketUtils.updateTestState(socket, scenario.title, 'stopped');

    // Emit test result through the agent's callback
    websocketUtils.addResult(socket, {
      type: WebsocketCopilotUpdate.SCENARIO_COMPLETED,
      data: {
        title: scenario.title,
        ...result,
        timestamp: new Date().toISOString(),
      }
    });
  }
}
