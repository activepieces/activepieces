import { FlowType } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantPieces } from '../embeddings';
import { stepAgent } from './step-agent';
import { planSchema } from './schemas';
import { z } from 'zod';
import { Agent } from '../types/agent';

interface PlannerAgent extends Agent<FlowType> {
  onTestResult?: (result: any) => void;
}

type StepPlan = z.infer<typeof planSchema>['steps'][0];

export const plannerAgent: PlannerAgent = {
  onTestResult: undefined,

  async plan(prompt: string): Promise<FlowType> {
    console.debug('Starting flow planning process...');

    // Step 1: Find relevant pieces
    const relevantPieces = await findRelevantPieces(prompt);
    console.debug('Found relevant pieces:', relevantPieces.map(p => p.metadata.pieceName));

    // Emit pieces found event
    this.onTestResult?.({
      type: 'PIECES_FOUND',
      data: {
        timestamp: new Date().toISOString(),
        relevantPieces: relevantPieces.map(p => ({
          pieceName: p.metadata.pieceName,
          content: p.content
        }))
      }
    });

    // Step 2: Generate high-level plan using AI
    const { object: plan } = await generateObject({
      model: openai('gpt-4o'),
      schema: planSchema,
      prompt: `
        You are a planner agent that creates high-level plans for automation flows.
        
        Available pieces:
        ${relevantPieces.map(p => `- ${p.metadata.pieceName}: ${p.content}`).join('\n')}

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
    this.onTestResult?.({
      type: 'PLAN_GENERATED',
      data: {
        timestamp: new Date().toISOString(),
        plan
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
      this.onTestResult?.({
        type: 'STEP_CREATED',
        data: {
          timestamp: new Date().toISOString(),
          step
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
    this.onTestResult?.({
      type: 'SCENARIO_COMPLETED',
      data: {
        timestamp: new Date().toISOString(),
        output: flow
      }
    });

    return flow;
  }
};
