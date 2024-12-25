import { FlowType } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantPieces } from '../tools/embeddings';
import { planSchema } from '../types/schemas';
import { Agent } from './agent';
import { stepAgent } from './generate-step';
import { WebsocketCopilotUpdate } from '@activepieces/copilot-shared';
import { Socket } from 'socket.io';
import { websocketUtils } from '../util/websocket';

export interface PlanOptions {
  relevanceThreshold?: number;
}

export const plannerAgent: Agent<FlowType> = {

  async plan(prompt: string, socket: Socket | null, options?: PlanOptions): Promise<FlowType> {
    // Step 1: Find relevant pieces
    const relevantPieces = await findRelevantPieces(prompt, options?.relevanceThreshold);
    
    // Emit pieces found event
    websocketUtils.addResult(socket, {
      type: WebsocketCopilotUpdate.PIECES_FOUND,
      data: {
        timestamp: new Date().toISOString(),
        relevantPieces: relevantPieces.map((p) => ({
          pieceName: p.metadata.pieceName,
          content: p.content,
          logoUrl: p.metadata.logoUrl,
          relevanceScore: p.similarity || 0,
        })),
      }
    });

    // Step 2: Generate high-level plan using AI
    const { object: plan } = await generateObject({
      model: openai('gpt-4o'),
      schema: planSchema,
      prompt: `
        You are a planner agent that creates high-level plans for automation flows.
        
        Available pieces:
        ${relevantPieces
          .map((p) => `- ${p.metadata.pieceName}: ${p.content}`)
          .join('\n')}

        User request: ${prompt}

        Create a high-level plan that:
        1. Starts with a trigger step
        2. Includes necessary action steps
        3. Uses router steps only when conditional logic is needed

        The plan should have:
        - A descriptive name that summarizes what it does
        - A clear description of its purpose
        - A sequence of steps with their types and piece information

        IMPORTANT:
        - First try to use piece triggers and actions directly
        - Only use ROUTER if the logic cannot be handled by piece capabilities
        - Keep the plan as simple as possible while meeting the requirements
      `,
    });

    // Emit plan generated event
    websocketUtils.addResult(socket, {
      type: WebsocketCopilotUpdate.PLAN_GENERATED,
      data: {
        timestamp: new Date().toISOString(),
        plan,
      }
    });

    // Step 3: Create each step using the step agent
    const steps = [];
    for (let i = 0; i < plan.steps.length; i++) {
      const stepPlan = plan.steps[i];
      const step = await stepAgent.createStep({
        stepType: stepPlan.type,
        pieceName: stepPlan.pieceName,
        actionOrTriggerName: stepPlan.actionOrTriggerName,
        previousSteps: steps,
        condition: stepPlan.condition,
      });

      // Emit step created event
      websocketUtils.addResult(socket, {
        type: WebsocketCopilotUpdate.STEP_CREATED,
        data: {
          timestamp: new Date().toISOString(),
          step,
        }
      });

      steps.push(step);
    }

    const flow = {
      name: plan.name,
      description: plan.description,
      steps,
    };

    // Emit final flow created event
    websocketUtils.addResult(socket, {
      type: WebsocketCopilotUpdate.SCENARIO_COMPLETED,
      data: {
        timestamp: new Date().toISOString(),
        output: flow,
      }
    });

    return flow;
  },
};
