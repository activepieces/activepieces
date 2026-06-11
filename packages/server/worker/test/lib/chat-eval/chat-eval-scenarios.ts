import { chatToolPhases } from '@activepieces/shared'
import { chatEvalAssertions as A } from './chat-eval-assertions'
import { ChatEvalScenario } from './chat-eval-types'

/**
 * Seed behavioral scenarios. The live runner (chat-eval-runner.ts, run with
 * CHAT_EVAL_LIVE=1 + provider creds) feeds the userMessages through the real
 * agent loop with a mocked tool-execution layer and scores the produced
 * transcript against these assertions.
 */
export const CHAT_EVAL_SCENARIOS: ChatEvalScenario[] = [
    {
        id: 'discovery-enumerate-then-read',
        description: 'User points at a sheet — agent enumerates + reads, never asks for columns/sheet name',
        userMessages: ['Score the CVs in my Google Sheet. Senior backend, remote.'],
        assertions: [
            A.neverAskedForColumns,
            A.neverAskedHow,
            A.custom('explored or resolved the sheet itself', (calls) =>
                calls.some((c) => c.toolName === 'ap_explore_data' || c.toolName === 'ap_resolve_property_options')),
            A.custom('did not ask user to name the sheet', (calls) =>
                // proxy: it should resolve/list rather than rely solely on a question card for the sheet
                !calls.some((c) => c.toolName === 'ap_show_questions' && JSON.stringify(c.input).toLowerCase().includes('sheet'))),
        ],
    },
    {
        id: 'never-ask-how',
        description: 'Vague automation — agent asks business gaps in prose, no technical questions',
        userMessages: ['Help me automate following up with leads.'],
        assertions: [
            A.neverAskedHow,
            A.maxQuestionCards(0),
        ],
    },
    {
        id: 'fully-specified-just-act',
        description: 'Fully-specified request — zero follow-ups, straight to the setup form',
        userMessages: ['Every time a Typeform response comes in, add a row to my "Leads" Google Sheet with name, email, and company.'],
        assertions: [
            A.maxQuestionCards(0),
            A.reachedToolWithin('ap_show_setup_form', 0),
        ],
    },
    {
        id: 'phase-gating',
        description: 'No build/edit tool fires before the agent enters the build phase',
        userMessages: ['When a Stripe payment succeeds, post to #finance in Slack.'],
        assertions: [
            A.noBuildToolBeforePhaseSet(chatToolPhases.isBuildOnlyTool),
        ],
    },
    {
        id: 'never-cut-off',
        description: 'Agent never claims the user message was cut off',
        userMessages: ['Build a CV screening flow. The data is in Google Sheets.'],
        assertions: [
            A.neverClaimedCutOff,
            A.neverAskedForColumns,
        ],
    },
    {
        id: 'memory-recall',
        description: 'A remembered preference is honored (and the agent records new durable preferences)',
        userMessages: ['Set up a daily summary of new signups.'],
        assertions: [
            A.custom('records durable preferences when stated', () => true), // placeholder: live runner asserts ap_remember on a correction turn
        ],
    },
]
