import { amazonBedrockGetModelInvocationLoggingConfiguration } from './account/get-model-invocation-logging-configuration';
import { amazonBedrockListEnforcedGuardrailConfigurations } from './guardrails/list-enforced-guardrail-configurations';
import { amazonBedrockConverse } from './models/converse';
import { amazonBedrockCountTokens } from './models/count-tokens';
import { amazonBedrockGetFoundationModel } from './models/get-foundation-model';
import { amazonBedrockGetFoundationModelAvailability } from './models/get-foundation-model-availability';
import { amazonBedrockGetInferenceProfile } from './models/get-inference-profile';
import { amazonBedrockGetPromptRouter } from './models/get-prompt-router';
import { amazonBedrockInvokeModel } from './models/invoke-model';
import { amazonBedrockListFoundationModels } from './models/list-foundation-models';
import { amazonBedrockListInferenceProfiles } from './models/list-inference-profiles';
import { amazonBedrockListPromptRouters } from './models/list-prompt-routers';
import { amazonBedrockCreatePrompt } from './prompts/create-prompt';
import { amazonBedrockCreatePromptVersion } from './prompts/create-prompt-version';
import { amazonBedrockDeletePrompt } from './prompts/delete-prompt';
import { amazonBedrockGetPrompt } from './prompts/get-prompt';
import { amazonBedrockListPrompts } from './prompts/list-prompts';
import { amazonBedrockOptimizePrompt } from './prompts/optimize-prompt';
import { amazonBedrockUpdatePrompt } from './prompts/update-prompt';
import { amazonBedrockCreateSession } from './sessions/create-session';
import { amazonBedrockCreateSessionInvocation } from './sessions/create-session-invocation';
import { amazonBedrockDeleteSession } from './sessions/delete-session';
import { amazonBedrockEndSession } from './sessions/end-session';
import { amazonBedrockGetSession } from './sessions/get-session';
import { amazonBedrockGetSessionInvocationStep } from './sessions/get-session-invocation-step';
import { amazonBedrockListSessionInvocationSteps } from './sessions/list-session-invocation-steps';
import { amazonBedrockListSessionInvocations } from './sessions/list-session-invocations';
import { amazonBedrockListSessions } from './sessions/list-sessions';
import { amazonBedrockPutSessionInvocationStep } from './sessions/put-session-invocation-step';
import { amazonBedrockUpdateSession } from './sessions/update-session';

export const amazonBedrockAiActions = [
  amazonBedrockConverse,
  amazonBedrockCountTokens,
  amazonBedrockGetFoundationModelAvailability,
  amazonBedrockGetFoundationModel,
  amazonBedrockGetInferenceProfile,
  amazonBedrockGetPromptRouter,
  amazonBedrockInvokeModel,
  amazonBedrockListFoundationModels,
  amazonBedrockListInferenceProfiles,
  amazonBedrockListPromptRouters,
  amazonBedrockListEnforcedGuardrailConfigurations,
  amazonBedrockCreatePromptVersion,
  amazonBedrockCreatePrompt,
  amazonBedrockDeletePrompt,
  amazonBedrockGetPrompt,
  amazonBedrockListPrompts,
  amazonBedrockOptimizePrompt,
  amazonBedrockUpdatePrompt,
  amazonBedrockCreateSessionInvocation,
  amazonBedrockCreateSession,
  amazonBedrockDeleteSession,
  amazonBedrockEndSession,
  amazonBedrockGetSessionInvocationStep,
  amazonBedrockGetSession,
  amazonBedrockListSessionInvocationSteps,
  amazonBedrockListSessionInvocations,
  amazonBedrockListSessions,
  amazonBedrockPutSessionInvocationStep,
  amazonBedrockUpdateSession,
  amazonBedrockGetModelInvocationLoggingConfiguration,
];
