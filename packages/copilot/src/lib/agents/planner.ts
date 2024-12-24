import { Flow, FlowType } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantPieces } from '../embeddings';
import { stepAgent } from './step-agent';
import { planSchema } from './schemas';
import { z } from 'zod';

interface PlannerAgent {
  plan(prompt: string): Promise<FlowType>;
}

type StepPlan = z.infer<typeof planSchema>['steps'][0];

export const plannerAgent: PlannerAgent = {
  async plan(prompt: string): Promise<FlowType> {
    console.debug('Starting flow planning process...');

    // Step 1: Find relevant pieces
    const relevantPieces = await findRelevantPieces(prompt);
    console.debug('Found relevant pieces:', relevantPieces.map(p => p.metadata.pieceName));

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
      steps.push(step);
    }

    return {
      name: plan.name,
      description: plan.description,
      steps,
    };
  },
};
