import { FlowType } from '../types/flow-outline';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { findRelevantPieces } from '../tools/embeddings';
import { planSchema } from '../types/schemas';
import { Agent } from './agent';
import { stepAgent } from './generate-step';
import { WebsocketCopilotUpdate, StepConfig } from '@activepieces/copilot-shared';
import { Socket } from 'socket.io';
import { websocketUtils } from '../util/websocket';
import { PromptTemplate } from '../util/prompt-template';

export interface PlanOptions {
  relevanceThreshold?: number;
  customPrompt?: string;
  stepConfig?: StepConfig;
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
    const availablePieces = relevantPieces
      .map((p) => `- ${p.metadata.pieceName}: ${p.content}`)
      .join('\n');

    const stepConfigText = options?.stepConfig ? 
      `Follow this exact step sequence:\n${options.stepConfig.steps.map((step, index) => 
        `${index + 1}. [${step.type}] ${step.description}`
      ).join('\n')}` : '';

    const promptVariables = {
      available_pieces: `Available pieces:\n${availablePieces}`,
      user_prompt: prompt,
      step_config: stepConfigText,
      step_config_note: options?.stepConfig ? '- Follow the exact step sequence provided above' : ''
    };

    const finalPrompt = options?.customPrompt ? 
      PromptTemplate.processCustomPrompt(options.customPrompt, promptVariables) : 
      PromptTemplate.getPlannerPrompt(promptVariables);

    const { object: plan } = await generateObject({
      model: openai('gpt-4o'),
      schema: planSchema,
      prompt: finalPrompt,
      maxRetries: 3,
      temperature: 0.3,
      maxTokens: 1000,
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

    return flow;
  },
};
