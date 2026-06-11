/**
 * Behavioral evaluation harness for the chat agent.
 *
 * The deterministic core here is pure: it asserts over a Transcript (the tool
 * calls + assistant text the agent produced for a scenario). It does NOT run
 * the LLM. The live runner (see chat-eval-runner.ts) drives the real agent loop
 * with mocked tool execution + a live/replay LLM and produces the Transcript
 * these assertions score. Keeping the assertions pure makes them unit-testable
 * with synthetic transcripts and stable across model nondeterminism.
 */

export type ToolCallRecord = {
    /** turn index (0-based) the call happened in */
    turn: number
    toolName: string
    input: Record<string, unknown>
}

export type AssistantTextRecord = {
    turn: number
    text: string
}

export type Transcript = {
    toolCalls: ToolCallRecord[]
    assistantTexts: AssistantTextRecord[]
    /** number of assistant turns produced */
    turns: number
}

export type AssertionResult = {
    name: string
    passed: boolean
    detail?: string
}

export type Assertion = (transcript: Transcript) => AssertionResult

export type ChatEvalScenario = {
    id: string
    description: string
    /** user message(s), one per turn the harness feeds in */
    userMessages: string[]
    /**
     * Optional canned tool results for the live runner's mocked execution layer,
     * keyed by toolName. The deterministic assertion tests don't use these.
     */
    toolStubs?: Record<string, unknown>
    assertions: Assertion[]
}

export type ScenarioReport = {
    scenarioId: string
    passed: boolean
    results: AssertionResult[]
}

export type EvalReport = {
    promptHash: string
    toolsetHash: string
    scenarios: ScenarioReport[]
    passRate: number
}
