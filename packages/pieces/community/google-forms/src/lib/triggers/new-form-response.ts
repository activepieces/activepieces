import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  MarkdownVariant,
  Property,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { googleFormsCommon, googleFormsAuth, getAccessToken, GoogleFormsAuthValue } from '../common/common';
import { newResponseTriggerOutputSchema } from '../output-schemas';

const RUN_ON_NEW_ONLY = 'new_only';
const RUN_ON_NEW_AND_EDITED = 'new_and_edited';

export const newResponse = createTrigger({
  auth: googleFormsAuth,
  name: 'new_response',
  classification: 'READ',
  displayName: 'New Response',
  description: 'Triggers when someone submits a response to the form. Can also trigger when a respondent edits their response.',
  aiMetadata: {
    description:
      'Fires when a respondent submits a response to the specified Google Form. With run_on "new_only" each response fires exactly once, at its first submission, and edits never fire. With run_on "new_and_edited" (also used when run_on is empty) it fires at the first submission and again every time the respondent edits and resubmits; the repeat event has the same responseId and a later lastSubmittedTime. Each event is one response with its responseId, createTime (first submission), lastSubmittedTime (latest submission) and answers keyed by question ID.',
  },
  outputSchema: newResponseTriggerOutputSchema,
  props: {
    info: Property.MarkDown({
      value:
        'Checks the form every few minutes. With **New responses only**, each response starts the flow once, when it is first sent. With **New and edited responses**, it also starts the flow again every time the respondent edits and resends it (respondents can only edit when **Allow response editing** is on in the form settings). Only responses sent after the flow is published count. Upgrading the piece version in the builder pre-selects **New responses only**; choose **New and edited responses** to keep the old behaviour.',
      variant: MarkdownVariant.INFO,
    }),
    form_id: googleFormsCommon.form_id,
    include_team_drives: googleFormsCommon.include_team_drives,
    run_on: Property.StaticDropdown<string>({
      displayName: 'Run On',
      description:
        'Choose whether an edited response starts the flow again.',
      required: false,
      defaultValue: RUN_ON_NEW_ONLY,
      options: {
        disabled: false,
        options: [
          { label: 'New responses only', value: RUN_ON_NEW_ONLY },
          { label: 'New and edited responses', value: RUN_ON_NEW_AND_EDITED },
        ],
      },
    }),
  },
  sampleData: {
    responseId:
      'ACYDBNhZI4SENjOwT4QIcXOhgco3JhuLftjpLspxETYljVZofOWuqH7bxKQqJWDwGw2IFqE',
    createTime: '2023-04-01T03:19:28.889Z',
    lastSubmittedTime: '2023-04-01T03:19:28.889881Z',
    answers: {
      '5bdc4001': {
        questionId: '5bdc4001',
        textAnswers: {
          answers: [
            {
              value: 'test',
            },
          ],
        },
      },
      '283d759e': {
        questionId: '283d759e',
        textAnswers: {
          answers: [
            {
              value: 'نعم',
            },
          ],
        },
      },
      '46f3e9cf': {
        questionId: '46f3e9cf',
        textAnswers: {
          answers: [
            {
              value: 'test',
            },
          ],
        },
      },
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await fetchSample({
      auth: context.auth,
      formId: context.propsValue.form_id,
      runOn: resolveRunOn(context.propsValue.run_on),
    });
  },
  async onEnable(context) {
    const formId = context.propsValue.form_id;
    const runOn = resolveRunOn(context.propsValue.run_on);
    if (context.isRepublish) {
      const existing = await loadState(context.store);
      if (existing.state !== null && stateMatches({ state: existing.state, formId, runOn })) {
        await saveState({
          store: context.store,
          state: { ...existing.state, formId, runOn },
          dropLegacy: existing.fromLegacy,
        });
        return;
      }
    }
    await saveState({ store: context.store, state: baselineState({ formId, runOn }), dropLegacy: true });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const formId = context.propsValue.form_id;
    const runOn = resolveRunOn(context.propsValue.run_on);
    const { state, fromLegacy } = await loadState(context.store);
    if (state === null || !stateMatches({ state, formId, runOn })) {
      await saveState({ store: context.store, state: baselineState({ formId, runOn }), dropLegacy: fromLegacy });
      return [];
    }
    const { responses, complete } = await listResponses({
      auth: context.auth,
      formId,
      submittedAfterMs: state.scannedMs - 1,
      deadline: Date.now() + POLL_DEADLINE_MS,
    });
    if (!complete) {
      throw new Error(
        'Google Forms returned more responses than could be read in one check. Nothing was skipped; the next check reads them again.'
      );
    }
    const { fresh, nextState } = selectFresh({ responses, state, runOn, formId });
    await saveState({ store: context.store, state: nextState, dropLegacy: fromLegacy });
    return fresh;
  },
});

function resolveRunOn(value: string | undefined | null): RunOn {
  return value === RUN_ON_NEW_ONLY ? RUN_ON_NEW_ONLY : RUN_ON_NEW_AND_EDITED;
}

function toEpochMs(value: string | undefined): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function eventTimeMs({ response, runOn }: { response: FormResponse; runOn: RunOn }): number | null {
  if (runOn === RUN_ON_NEW_ONLY) {
    return toEpochMs(response.createTime ?? response.lastSubmittedTime);
  }
  return toEpochMs(response.lastSubmittedTime);
}

function baselineState({ formId, runOn }: { formId: string; runOn: RunOn }): PollState {
  const startMs = Date.now() + 1;
  return { formId, runOn, cursorMs: startMs, scannedMs: startMs, seen: [] };
}

function stateMatches({ state, formId, runOn }: { state: PollState; formId: string; runOn: RunOn }): boolean {
  const sameForm = state.formId === undefined || state.formId === formId;
  const sameMode = state.runOn === undefined || state.runOn === runOn;
  return sameForm && sameMode;
}

async function loadState(store: Store): Promise<{ state: PollState | null; fromLegacy: boolean }> {
  const state = await store.get<PollState>(STATE_KEY);
  if (state !== null && state !== undefined) {
    return { state, fromLegacy: false };
  }
  const legacyLastPoll = await store.get<number>(LEGACY_STATE_KEY);
  if (typeof legacyLastPoll === 'number' && Number.isFinite(legacyLastPoll)) {
    return {
      state: { cursorMs: legacyLastPoll + 1, scannedMs: legacyLastPoll + 1, seen: [] },
      fromLegacy: true,
    };
  }
  return { state: null, fromLegacy: legacyLastPoll !== null && legacyLastPoll !== undefined };
}

async function saveState({
  store,
  state,
  dropLegacy,
}: {
  store: Store;
  state: PollState;
  dropLegacy: boolean;
}): Promise<void> {
  await store.put(STATE_KEY, state);
  if (dropLegacy) {
    await store.delete(LEGACY_STATE_KEY);
  }
}

function isSeen({ response, seen, runOn }: { response: FormResponse; seen: SeenResponse[]; runOn: RunOn }): boolean {
  if (runOn === RUN_ON_NEW_ONLY) {
    return seen.some((entry) => entry.responseId === response.responseId);
  }
  return seen.some(
    (entry) =>
      entry.responseId === response.responseId &&
      entry.lastSubmittedTime === response.lastSubmittedTime
  );
}

function selectFresh({
  responses,
  state,
  runOn,
  formId,
}: {
  responses: FormResponse[];
  state: PollState;
  runOn: RunOn;
  formId: string;
}): { fresh: FormResponse[]; nextState: PollState } {
  const latestAcceptedMs = Date.now() + FUTURE_TOLERANCE_MS;
  let scannedMs = state.scannedMs;
  const candidates: { eventMs: number; response: FormResponse }[] = [];
  for (const response of responses) {
    const submittedMs = toEpochMs(response.lastSubmittedTime);
    const eventMs = eventTimeMs({ response, runOn });
    if (submittedMs === null || eventMs === null || submittedMs > latestAcceptedMs) {
      continue;
    }
    scannedMs = Math.max(scannedMs, submittedMs);
    if (eventMs < state.cursorMs) {
      continue;
    }
    if (eventMs === state.cursorMs && isSeen({ response, seen: state.seen, runOn })) {
      continue;
    }
    candidates.push({ eventMs, response });
  }
  const cursorMs = candidates.reduce((max, candidate) => Math.max(max, candidate.eventMs), state.cursorMs);
  const seenAtCursor = candidates
    .filter((candidate) => candidate.eventMs === cursorMs)
    .map((candidate) => ({
      responseId: candidate.response.responseId,
      lastSubmittedTime: candidate.response.lastSubmittedTime,
    }));
  const seen = cursorMs === state.cursorMs ? [...state.seen, ...seenAtCursor] : seenAtCursor;
  const fresh = candidates
    .sort((a, b) => b.eventMs - a.eventMs || a.response.responseId.localeCompare(b.response.responseId))
    .map((candidate) => candidate.response);
  return { fresh, nextState: { formId, runOn, cursorMs, scannedMs, seen } };
}

async function listResponses({
  auth,
  formId,
  submittedAfterMs,
  deadline,
  maxPages,
}: {
  auth: GoogleFormsAuthValue;
  formId: string;
  submittedAfterMs: number | null;
  deadline: number;
  maxPages?: number;
}): Promise<{ responses: FormResponse[]; complete: boolean }> {
  const accessToken = await getAccessToken(auth);
  const byId = new Map<string, FormResponse>();
  let pageToken: string | undefined;
  let pages = 0;
  do {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0 || (maxPages !== undefined && pages >= maxPages)) {
      return { responses: [...byId.values()], complete: false };
    }
    const queryParams: Record<string, string> = { pageSize: String(PAGE_SIZE) };
    if (submittedAfterMs !== null) {
      queryParams['filter'] = `timestamp > ${new Date(submittedAfterMs).toISOString()}`;
    }
    if (pageToken !== undefined) {
      queryParams['pageToken'] = pageToken;
    }
    const response = await httpClient.sendRequest<{
      responses?: FormResponse[];
      nextPageToken?: string;
    }>({
      url: `https://forms.googleapis.com/v1/forms/${formId}/responses`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      queryParams,
      timeout: Math.min(REQUEST_TIMEOUT_MS, remainingMs),
    });
    pages += 1;
    const pageResponses = Array.isArray(response.body?.responses) ? response.body.responses : [];
    for (const item of pageResponses) {
      if (typeof item?.responseId !== 'string') {
        continue;
      }
      const known = byId.get(item.responseId);
      if (known === undefined || (toEpochMs(item.lastSubmittedTime) ?? 0) >= (toEpochMs(known.lastSubmittedTime) ?? 0)) {
        byId.set(item.responseId, item);
      }
    }
    const next = response.body?.nextPageToken;
    pageToken = typeof next === 'string' && next.length > 0 ? next : undefined;
  } while (pageToken !== undefined);
  return { responses: [...byId.values()], complete: true };
}

function newestFirst({ responses, runOn }: { responses: FormResponse[]; runOn: RunOn }): FormResponse[] {
  return responses
    .map((response) => ({ response, eventMs: eventTimeMs({ response, runOn }) }))
    .filter((entry): entry is { response: FormResponse; eventMs: number } => entry.eventMs !== null)
    .sort((a, b) => b.eventMs - a.eventMs || a.response.responseId.localeCompare(b.response.responseId))
    .slice(0, SAMPLE_SIZE)
    .map((entry) => entry.response);
}

async function fetchSample({
  auth,
  formId,
  runOn,
}: {
  auth: GoogleFormsAuthValue;
  formId: string;
  runOn: RunOn;
}): Promise<FormResponse[]> {
  const startedAt = Date.now();
  const deadline = startedAt + POLL_DEADLINE_MS;
  let found: FormResponse[] = [];
  for (const windowMs of SAMPLE_WINDOWS_MS) {
    const windowStartMs = startedAt - windowMs;
    const { responses, complete } = await listResponses({
      auth,
      formId,
      submittedAfterMs: windowStartMs,
      deadline,
    });
    const inWindow = responses.filter((response) => {
      const eventMs = eventTimeMs({ response, runOn });
      return eventMs !== null && eventMs > windowStartMs;
    });
    if (inWindow.length >= SAMPLE_SIZE || !complete) {
      return newestFirst({ responses: inWindow.length > 0 ? inWindow : responses, runOn });
    }
    found = responses;
  }
  const { responses } = await listResponses({
    auth,
    formId,
    submittedAfterMs: null,
    deadline,
    maxPages: 1,
  });
  return newestFirst({ responses: latestPerResponse({ responses: [...responses, ...found] }), runOn });
}

function latestPerResponse({ responses }: { responses: FormResponse[] }): FormResponse[] {
  const byId = responses.reduce((acc, response) => {
    const known = acc.get(response.responseId);
    const isNewer = known === undefined || (toEpochMs(response.lastSubmittedTime) ?? 0) > (toEpochMs(known.lastSubmittedTime) ?? 0);
    return isNewer ? acc.set(response.responseId, response) : acc;
  }, new Map<string, FormResponse>());
  return [...byId.values()];
}

const STATE_KEY = 'new_response_state';
const LEGACY_STATE_KEY = 'lastPoll';
const PAGE_SIZE = 5000;
const SAMPLE_SIZE = 5;
const REQUEST_TIMEOUT_MS = 20_000;
const POLL_DEADLINE_MS = 45_000;
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const SAMPLE_WINDOWS_MS = [DAY_MS, 30 * DAY_MS, 365 * DAY_MS];

type RunOn = typeof RUN_ON_NEW_ONLY | typeof RUN_ON_NEW_AND_EDITED;

type FormResponse = {
  responseId: string;
  createTime?: string;
  lastSubmittedTime: string;
  [key: string]: unknown;
};

type SeenResponse = {
  responseId: string;
  lastSubmittedTime: string;
};

type PollState = {
  formId?: string;
  runOn?: RunOn;
  cursorMs: number;
  scannedMs: number;
  seen: SeenResponse[];
};
