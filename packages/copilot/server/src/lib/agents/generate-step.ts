import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import axios from 'axios';
import {
  PieceMetadata,
  ActionBase,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { FlowStep } from '../types/flow-outline';
import { z } from 'zod';

interface StepContext {
  stepType: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  pieceName: string;
  actionOrTriggerName?: string;
  previousSteps?: FlowStep[];
  condition?: string;
}

async function fetchPieceMetadata(
  pieceName: string
): Promise<PieceMetadata | null> {
  try {
    const response = await axios.get(
      `https://cloud.activepieces.com/api/v1/pieces/${pieceName}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching metadata for piece ${pieceName}:`, error);
    return null;
  }
}

function formatAvailableActions(actions: Record<string, ActionBase>): string {
  return Object.entries(actions)
    .map(
      ([name, action]) =>
        `${action.displayName} (${name}): ${action.description}`
    )
    .join('\n');
}

function formatAvailableTriggers(
  triggers: Record<string, TriggerBase>
): string {
  return Object.entries(triggers)
    .map(
      ([name, trigger]) =>
        `${trigger.displayName} (${name}): ${trigger.description}`
    )
    .join('\n');
}

function getRouterContext(): string {
  return `
    Router Step Information:
    This is a system step type that handles conditional logic.
    
    Available Operators:
    Text Operators:
    - TEXT_CONTAINS: Check if text contains a value
    - TEXT_DOES_NOT_CONTAIN: Check if text doesn't contain a value
    - TEXT_EXACTLY_MATCHES: Check if text exactly matches
    - TEXT_DOES_NOT_EXACTLY_MATCH: Check if text doesn't exactly match
    - TEXT_STARTS_WITH: Check if text starts with value
    - TEXT_DOES_NOT_START_WITH: Check if text doesn't start with value
    - TEXT_ENDS_WITH: Check if text ends with value
    - TEXT_DOES_NOT_END_WITH: Check if text doesn't end with value

    Number Operators:
    - NUMBER_IS_GREATER_THAN: Check if number is greater than value
    - NUMBER_IS_LESS_THAN: Check if number is less than value
    - NUMBER_IS_EQUAL_TO: Check if number equals value

    Boolean Operators:
    - BOOLEAN_IS_TRUE: Check if value is true
    - BOOLEAN_IS_FALSE: Check if value is false

    List Operators:
    - LIST_CONTAINS: Check if list contains value
    - LIST_DOES_NOT_CONTAIN: Check if list doesn't contain value
    - LIST_IS_EMPTY: Check if list is empty
    - LIST_IS_NOT_EMPTY: Check if list is not empty

    Other Operators:
    - EXISTS: Check if value exists
    - DOES_NOT_EXIST: Check if value doesn't exist

    Router Execution Types:
    - EXECUTE_ALL_MATCH: Execute all branches where conditions match
    - EXECUTE_FIRST_MATCH: Execute only the first branch where conditions match
  `;
}
const stepGenerationSchema = z.object({
  name: z.string(),
  type: z.enum(['PIECE_TRIGGER', 'PIECE', 'ROUTER']),
  piece: z.object({
    pieceName: z.string(),
    triggerName: z.string().optional(),
    actionName: z.string().optional(),
  }),
  input: z.record(z.any()).optional(),
  children: z
    .array(
      z.object({
        name: z.string(),
        condition: z.string(),
        piece: z.object({
          pieceName: z.string(),
          actionName: z.string().optional(),
        }),
        input: z.record(z.any()).optional(),
      })
    ).optional(),
});


interface StepAgent {
  createStep(context: StepContext): Promise<FlowStep>;
}

export const stepAgent: StepAgent = {
  async createStep(context: StepContext): Promise<FlowStep> {

    let stepContext: string;

    if (context.stepType === 'ROUTER') {
      stepContext = getRouterContext();
    } else {
      // Fetch piece metadata for non-router steps
      const pieceMetadata = await fetchPieceMetadata(context.pieceName);
      if (!pieceMetadata) {
        throw new Error(
          `Could not fetch metadata for piece ${context.pieceName}`
        );
      }

      stepContext = `
        Piece Information:
        - Name: ${pieceMetadata.displayName} (${pieceMetadata.name})
        - Description: ${pieceMetadata.description}

        ${
          context.stepType === 'PIECE_TRIGGER'
            ? `Available Triggers:
        ${formatAvailableTriggers(pieceMetadata.triggers)}`
            : ''
        }

        ${
          context.stepType === 'PIECE'
            ? `Available Actions:
        ${formatAvailableActions(pieceMetadata.actions)}`
            : ''
        }
      `;
    }

    stepContext += `
      ${
        context.previousSteps
          ? `\nPrevious Steps:\n${context.previousSteps
              .map((step) => `- ${step.name} (${step.type})`)
              .join('\n')}`
          : ''
      }
      
      ${
        context.condition
          ? `\nCondition to implement: ${context.condition}`
          : ''
      }
    `;

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: stepGenerationSchema,
      prompt: `
        You are a step creation agent that generates a single step for an automation flow.
        
        Current Context:
        ${stepContext}

        Create a step that:
        - Has a clear, descriptive name explaining what it does
        ${
          context.stepType === 'ROUTER'
            ? `
        - Implements the condition logic using the appropriate operators
        - Uses EXECUTE_FIRST_MATCH by default unless multiple matches are needed
        - Each condition should reference previous step outputs correctly
        `
            : `
        - Uses the correct piece settings (${context.pieceName})
        - ${
          context.stepType === 'PIECE_TRIGGER'
            ? 'Uses the correct trigger name (not display name) from the available triggers'
            : ''
        }
        - ${
          context.stepType === 'PIECE'
            ? 'Uses the correct action name (not display name) from the available actions'
            : ''
        }
        `
        }
        - Includes necessary input parameters using connection placeholders

        IMPORTANT:
        - The step type must be: ${context.stepType}
        ${
          context.stepType !== 'ROUTER'
            ? '- For triggers and actions, use the internal name (not display name)'
            : ''
        }
        - Use proper variable references (e.g., {{trigger.data}}, {{steps.step_name.output}})
        - Put all configuration in the input object
        - Keep the step focused and simple
      `,
    });

    return object as FlowStep;
  },
};
