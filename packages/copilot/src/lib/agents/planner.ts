import { FlowTrigger } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export const plannerAgent: Agent<FlowTrigger> = {
  async plan(prompt: string) {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: FlowTrigger,
      prompt: `
            You are a planner agent that creates a flow outline for a user, the goal is to create a flow outline that start with a trigger and then have a simple or conditional action.

            ${prompt}
            `,
    });

    return object;
  },
};
