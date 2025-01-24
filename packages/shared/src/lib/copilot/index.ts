import { z } from 'zod';
import { ImportFlowRequest, UpdateActionRequest } from '../flows/operations';

export const CopilotActionStep = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal('action')
});

export type CopilotActionStep = z.infer<typeof CopilotActionStep>;

export const CopilotRouterStep = z.object({
  title: z.string(),
  description: z.string(),
  type: z.literal('router'),
  branches: z.array(z.object({
    condition: z.string(),
    steps: z.array(CopilotActionStep)
  }))
});

export type CopilotRouterStep = z.infer<typeof CopilotRouterStep>;

export const CopilotStepPlan = z.discriminatedUnion('type', [
  CopilotActionStep,
  CopilotRouterStep
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

export enum CopilotSkill {
  PLANNER = 'planner',
  ACTION = 'action',
}

export const AskCopilotRequest = z.object({
  id: z.string(),
  skill: z.nativeEnum(CopilotSkill),
  selectedStep: z.string().optional(),
  flowId: z.string(),
  prompts: z.array(z.string().min(4)),
});
export type AskCopilotRequest = z.infer<typeof AskCopilotRequest>;

export const CopilotFlowPlanResponse = z.object({
  workflow: CopilotFlowOutline.optional(),
  errorMessage: z.string().optional(),
});

export type CopilotFlowPlanResponse = z.infer<typeof CopilotFlowPlanResponse>;

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
  type: 'action',
  operation: UpdateActionRequest,
  code: string,
}