import { z } from 'zod';
import { FlowOperationRequest, ImportFlowRequest } from '../flows/operations';

const ActionStep = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal('action')
});

type ActionStep = z.infer<typeof ActionStep>;

const RouterStep = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal('router'),
  branches: z.array(z.object({
    condition: z.string(),
    steps: z.array(ActionStep)
  }))
});

type RouterStep = z.infer<typeof RouterStep>;

export const CopilotStepPlan = z.discriminatedUnion('type', [
  ActionStep,
  RouterStep
]);

export type CopilotStepPlan = z.infer<typeof CopilotStepPlan>;

export const CopilotFlowOutline = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.object({
    title: z.string(),
    description: z.string(),
  }),
  steps: z.array(CopilotStepPlan),
});

export type CopilotFlowOutline = z.infer<typeof CopilotFlowOutline>;

export const AskCopilotRequest = z.object({
  id: z.string(),
  prompts: z.array(z.string().min(4)),
  currentWorkflow: CopilotFlowOutline.optional(),
});
export type AskCopilotRequest = z.infer<typeof AskCopilotRequest>;

export const ModificationType = z.enum([
  'ADD_ACTION',
  'UPDATE_ACTION',
  'DELETE_ACTION',
  'ADD_BRANCH',
  'UPDATE_BRANCH',
  'DELETE_BRANCH',
  'UPDATE_TRIGGER'
]);

export type ModificationType = z.infer<typeof ModificationType>;

export const WorkflowModification = z.object({
  type: ModificationType,
  path: z.string(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  description: z.string()
});

export type WorkflowModification = z.infer<typeof WorkflowModification>;

export const CopilotFlowPlanResponse = z.object({
  workflow: CopilotFlowOutline.optional(),
  errorMessage: z.string().optional(),
});

export type CopilotFlowPlanResponse = z.infer<typeof CopilotFlowPlanResponse>;

export const CopilotTriggerResponse = z.object({
  pieceName: z.string(),
  pieceVersion: z.string(),
  triggerName: z.string(),
});

export type CopilotTriggerResponse = z.infer<typeof CopilotTriggerResponse>;

export const CopilotStepCodeResponse = z.object({
  code: z.string(),
});

export type CopilotStepCodeResponse = z.infer<typeof CopilotStepCodeResponse>;

export type AskCopilotResponse = 
{
  id: string,
  type: 'flow',
  plan: CopilotFlowOutline,
  operation: ImportFlowRequest,
} | {
  id: string,
  type: 'error',
  errorMessage: string,
} | {
  id: string,
  type: 'modifications',
  plan: CopilotFlowOutline,
  operations: FlowOperationRequest[]
}
