import { z } from 'zod';

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

const Step = z.discriminatedUnion('type', [
  ActionStep,
  RouterStep
]);

export const CopilotFlowOutline = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.object({
    title: z.string(),
    description: z.string(),
  }),
  steps: z.array(Step),
});

export type CopilotFlowOutline = z.infer<typeof CopilotFlowOutline>;

export const AskCopilotRequest = z.object({
    id: z.string(),
    prompts: z.array(z.string().min(4)),
  });
  export type AskCopilotRequest = z.infer<typeof AskCopilotRequest>;

  
export const CopilotFlowPlanResponse = z.object({
  id: z.string().optional(),
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

