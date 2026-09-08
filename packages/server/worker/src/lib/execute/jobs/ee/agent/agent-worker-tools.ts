import { createConfiguredFlowTools, createConfiguredKnowledgeBaseTools, createConfiguredPieceTools } from './tools/configured-tools'
import { createCrossProjectTools } from './tools/cross-project-tools'
import { createDisplayTools } from './tools/display-tools'
import { createEmailTools } from './tools/email-tools'
import { createEventEmitter } from './tools/event-emitter'
import { wrapTestFlowGate } from './tools/flow-gate-tools'
import { createAgentSurfaceTools, createBuildPlanTools, createLocalTools, createPhaseTools, createStructuredOutputTool, createThinkingTools } from './tools/session-tools'
import { extractResultText, extractUserFacingError, isSuccessResult, normalizePieceName, TOOL_EXECUTION_TIMEOUT_MS, truncateLargeResult, withToolTimeout } from './tools/tool-primitives'
import { createImageTools, createScrapeTools, createSearchTools, createWebTools } from './tools/web-media-tools'

export { AgentEventEmitter, GateDecision, TaintState } from './tools/tool-primitives'

export const agentWorkerTools = {
    createEventEmitter,
    createDisplayTools,
    createAgentSurfaceTools,
    createLocalTools,
    createCrossProjectTools,
    createWebTools,
    createSearchTools,
    createScrapeTools,
    createImageTools,
    createEmailTools,
    wrapTestFlowGate,
    createThinkingTools,
    createPhaseTools,
    createBuildPlanTools,
    createConfiguredPieceTools,
    createConfiguredFlowTools,
    createConfiguredKnowledgeBaseTools,
    createStructuredOutputTool,
    isSuccessResult,
    extractResultText,
    extractUserFacingError,
    truncateLargeResult,
    withToolTimeout,
    normalizePieceName,
    TOOL_EXECUTION_TIMEOUT_MS,
}

