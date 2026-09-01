import { ApId, isNil } from '@activepieces/core-utils'
import { ALL_PRINCIPAL_TYPES, BarrierSignalStatus, FlowRun, FlowRunStatus, MAX_SIGNAL_REASON_LENGTH, PauseType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import Mustache from 'mustache'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { findFlowRunOrThrow } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { projectService } from '../project/project-service'
import { barrierService } from './barrier-service'
import { resumePageHooks, ResumePageTheme } from './resume-page-hooks'
import { resumeService } from './resume-service'
import { waitpointService } from './waitpoint-service'
import { Waitpoint, WaitpointSignal, WaitpointStatus } from './waitpoint-types'

export const resumeController: FastifyPluginAsyncZod = async (app) => {
    /**
     * @deprecated A bare GET resumes the run (single-use), which lets an email link prefetch consume
     * the waitpoint. Kept unchanged for approval emails already delivered before the confirmation-page
     * rollout. New links use `/:id/waitpoints/:waitpointId/confirm`. See ADR 0005.
     */
    app.all('/:id/waitpoints/:waitpointId', ResumeByWaitpointRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleAsyncResume({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, body: req.body, headers, queryParams, log: req.log, reply })
    })

    app.all('/:id/waitpoints/:waitpointId/sync', ResumeByWaitpointRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleSyncResume({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, body: req.body, headers, queryParams, log: req.log, reply, correlationId: req.params.waitpointId })
    })

    /**
     * Scanner-safe resume. A GET/HEAD never consumes the waitpoint — it serves a confirmation page
     * whose Approve/Disapprove buttons POST back here; only the POST resumes. On open, the page reads
     * the waitpoint from the DB and shows an "already responded" state if the run has moved on.
     */
    app.all('/:id/waitpoints/:waitpointId/confirm', ResumeByWaitpointRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        if (req.method === 'GET' || req.method === 'HEAD') {
            await serveConfirmationPage({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, url: req.url, queryParams, log: req.log, reply })
            return
        }
        await handleConfirmResume({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, action: queryParams.action, body: req.body, headers, queryParams, log: req.log, reply })
    })

    app.all('/:id/signals/:signalId/confirm', ConfirmSignalRequest, async (req, reply) => {
        const queryParams = req.query as Record<string, string>
        if (req.method === 'GET' || req.method === 'HEAD') {
            await serveSignalConfirmationPage({ flowRunId: req.params.id, signalId: req.params.signalId, url: req.url, queryParams, log: req.log, reply })
            return
        }
        await handleSignalDecision({ flowRunId: req.params.id, signalId: req.params.signalId, action: queryParams.action, body: req.body, headers: req.headers as Record<string, string>, log: req.log, reply })
    })

    /**
     * @deprecated Deprecated since 2026-04-13. can be only removed after all paused jobs after deployment of this version to sink.
     * Handles resume for V0 waitpoints created by legacy pieces using run.pause() + generateResumeUrl().
     * The requestId param is NOT validated — flowRunId (an unguessable apId) provides access control.
     */
    app.all('/:id/requests/:requestId', V0ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        const waitpoint = await waitpointService(req.log).findPendingByVersion({ flowRunId: req.params.id, version: 'V0' })
        if (waitpoint) {
            await handleAsyncResume({ flowRunId: req.params.id, waitpointId: waitpoint.id, body: req.body, headers, queryParams, log: req.log, reply })
        }
        else {
            await handleLegacyAsyncResume({ flowRunId: req.params.id, body: req.body, headers, queryParams, log: req.log, reply })
        }
    })

    /**
     * @deprecated Deprecated since 2026-04-13. can be only removed after all paused jobs after deployment of this version to sink.
     */
    app.all('/:id/requests/:requestId/sync', V0ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        const waitpoint = await waitpointService(req.log).findPendingByVersion({ flowRunId: req.params.id, version: 'V0' })
        if (waitpoint) {
            await handleSyncResume({ flowRunId: req.params.id, waitpointId: waitpoint.id, body: req.body, headers, queryParams, log: req.log, reply, correlationId: waitpoint.workerHandlerId ?? waitpoint.id })
        }
        else {
            await handleLegacySyncResume({ flowRunId: req.params.id, body: req.body, headers, queryParams, log: req.log, reply, correlationId: req.params.requestId })
        }
    })
}

async function serveConfirmationPage({ flowRunId, waitpointId, url, queryParams, log, reply }: ConfirmationPageParams): Promise<void> {
    const flowRun = await findFlowRunOrThrow(flowRunId)
    const waitpoint = await waitpointService(log).findByIdAndFlowRunId({ waitpointId, flowRunId })
    const isOpen = !isNil(waitpoint) && waitpoint.type !== PauseType.BARRIER && waitpoint.status === WaitpointStatus.PENDING && flowRun.status === FlowRunStatus.PAUSED
    if (!isOpen) {
        await replyWithAlreadyResponded({ projectId: flowRun.projectId, log, reply })
        return
    }
    await replyWithConfirmationPage({ flowRun, url, queryParams, log, reply })
}

async function replyWithConfirmationPage({ flowRun, url, queryParams, log, reply, reasonField }: ReplyWithConfirmationPageParams): Promise<void> {
    const theme = await resolveResumePageTheme({ projectId: flowRun.projectId, log })
    const flowName = await resolveFlowName({ flowVersionId: flowRun.flowVersionId, log })
    const path = url.split('?')[0]
    const extra = {
        title: CONFIRM_TITLE,
        message: CONFIRM_MESSAGE,
        flowName,
        actions: {
            ...reasonField,
            approveUrl: buildActionUrl({ path, queryParams, action: 'approve' }),
            disapproveUrl: buildActionUrl({ path, queryParams, action: 'disapprove' }),
        },
    }
    await replyWithHtml({ reply, html: renderPage({ theme, extra }) })
}

async function replyWithAlreadyResponded({ projectId, log, reply }: ReplyWithAlreadyRespondedParams): Promise<void> {
    const theme = await resolveResumePageTheme({ projectId, log })
    await replyWithHtml({ reply, html: renderPage({ theme, extra: ALREADY_RESPONDED }) })
}

function buildActionUrl({ path, queryParams, action }: { path: string, queryParams: Record<string, string>, action: string }): string {
    const params = new URLSearchParams(queryParams)
    params.set('action', action)
    return `${path}?${params.toString()}`
}

async function handleConfirmResume({ flowRunId, waitpointId, action, body, headers, queryParams, log, reply }: ConfirmResumeParams): Promise<void> {
    const { flowRun, stale } = await resumeService(log).resumeFromWaitpoint({
        flowRunId,
        waitpointId,
        resumePayload: { body, headers, queryParams },
    })
    if (!acceptsHtml(headers)) {
        await reply.send({ message: stale ? EXPIRED_MESSAGE : RECORDED_MESSAGE })
        return
    }
    const theme = await resolveResumePageTheme({ projectId: flowRun.projectId, log })
    const extra = stale
        ? ALREADY_RESPONDED
        : { title: RECORDED_TITLE, message: recordedMessageForAction(action), success: true }
    await replyWithHtml({ reply, html: renderPage({ theme, extra }) })
}

async function serveSignalConfirmationPage({ flowRunId, signalId, url, queryParams, log, reply }: SignalConfirmationPageParams): Promise<void> {
    const flowRun = await findFlowRunOrThrow(flowRunId)
    const open = await resolveOpenSignal({ flowRunId, signalId, projectId: flowRun.projectId, flowRunStatus: flowRun.status, log })
    if (isNil(open)) {
        await replyWithAlreadyResponded({ projectId: flowRun.projectId, log, reply })
        return
    }
    await replyWithConfirmationPage({ flowRun, url, queryParams, log, reply, reasonField: { maxReasonLength: MAX_SIGNAL_REASON_LENGTH } })
}

async function handleSignalDecision({ flowRunId, signalId, action, body, headers, log, reply }: SignalDecisionParams): Promise<void> {
    const flowRun = await findFlowRunOrThrow(flowRunId)
    const theme = await resolveResumePageTheme({ projectId: flowRun.projectId, log })
    if (action !== 'approve' && action !== 'disapprove') {
        await respondToSignalDecision({ reply, headers, theme, status: StatusCodes.BAD_REQUEST, extra: { title: UNKNOWN_ACTION_TITLE, message: UNKNOWN_ACTION_MESSAGE, success: false } })
        return
    }
    const open = await resolveOpenSignal({ flowRunId, signalId, projectId: flowRun.projectId, flowRunStatus: flowRun.status, log })
    if (isNil(open)) {
        await respondToSignalDecision({ reply, headers, theme, status: StatusCodes.OK, extra: ALREADY_RESPONDED })
        return
    }
    const approved = action === 'approve'
    const reason = readReason(body)
    if (!isNil(reason) && reason.length > MAX_SIGNAL_REASON_LENGTH) {
        await respondToSignalDecision({ reply, headers, theme, status: StatusCodes.BAD_REQUEST, extra: { title: REASON_TOO_LONG_TITLE, message: reasonTooLongMessage(), success: false } })
        return
    }
    if (isReasonMissing({ reasonRequiredOn: open.barrier.policy?.reasonRequiredOn, approved, reason })) {
        await respondToSignalDecision({ reply, headers, theme, status: StatusCodes.BAD_REQUEST, extra: { title: REASON_REQUIRED_TITLE, message: REASON_REQUIRED_MESSAGE, success: false } })
        return
    }

    await barrierService(log).receiveSignal({
        signalId,
        projectId: flowRun.projectId,
        status: approved ? BarrierSignalStatus.SUCCEEDED : BarrierSignalStatus.REJECTED,
        result: { outcome: approved ? 'approved' : 'rejected', reason: reason ?? null, decidedBy: open.signal.label },
    })
    await respondToSignalDecision({ reply, headers, theme, status: StatusCodes.OK, extra: { title: RECORDED_TITLE, message: recordedMessageForAction(approved ? 'approve' : 'disapprove'), success: true } })
}

async function resolveOpenSignal({ flowRunId, signalId, projectId, flowRunStatus, log }: ResolveOpenSignalParams): Promise<OpenSignal | null> {
    if (flowRunStatus !== FlowRunStatus.PAUSED) {
        return null
    }
    const signal = await barrierService(log).findSignalById({ signalId, projectId })
    if (isNil(signal) || signal.status !== BarrierSignalStatus.PENDING) {
        return null
    }
    const barrier = await waitpointService(log).findByIdAndFlowRunId({ waitpointId: signal.waitpointId, flowRunId })
    if (isNil(barrier) || barrier.type !== PauseType.BARRIER || barrier.status !== WaitpointStatus.PENDING) {
        return null
    }
    return { signal, barrier }
}

function isReasonMissing({ reasonRequiredOn, approved, reason }: IsReasonMissingParams): boolean {
    const required = reasonRequiredOn ?? 'reject'
    if (required === 'none') {
        return false
    }
    if (required === 'reject' && approved) {
        return false
    }
    return isNil(reason) || reason.trim().length === 0
}

function readReason(body: unknown): string | undefined {
    if (isNil(body) || typeof body !== 'object') {
        return undefined
    }
    const reason = (body as Record<string, unknown>).reason
    return typeof reason === 'string' ? reason : undefined
}

function reasonTooLongMessage(): string {
    return `Your reason is longer than the ${MAX_SIGNAL_REASON_LENGTH} characters this form accepts. Shorten it and submit again — nothing was recorded.`
}

async function respondToSignalDecision({ reply, headers, theme, status, extra }: RespondToSignalDecisionParams): Promise<void> {
    if (!acceptsHtml(headers)) {
        await reply.status(status).send({ message: extra.message })
        return
    }
    await replyWithHtml({ reply, status, html: renderPage({ theme, extra }) })
}

async function handleAsyncResume({ flowRunId, waitpointId, body, headers, queryParams, log, reply }: AsyncResumeHandlerParams): Promise<void> {
    const { stale } = await resumeService(log).resumeFromWaitpoint({
        flowRunId,
        waitpointId,
        resumePayload: { body, headers, queryParams },
    })
    await reply.send({ message: stale ? EXPIRED_MESSAGE : RECORDED_MESSAGE })
}

async function handleSyncResume({ flowRunId, waitpointId, body, headers, queryParams, log, reply, correlationId }: AsyncResumeHandlerParams & { correlationId: string }): Promise<void> {
    const response = await resumeService(log).handleSyncResumeFlow({
        runId: flowRunId,
        waitpointId,
        payload: { body, headers, queryParams },
        correlationId,
    })
    await reply.status(response.status).headers(response.headers).send(response.body)
}

async function handleLegacyAsyncResume({ flowRunId, body, headers, queryParams, log, reply }: LegacyResumeHandlerParams): Promise<void> {
    const { stale } = await resumeService(log).legacyResume({
        flowRunId,
        resumePayload: { body, headers, queryParams },
    })
    await reply.send({ message: stale ? EXPIRED_MESSAGE : RECORDED_MESSAGE })
}

async function handleLegacySyncResume({ flowRunId, body, headers, queryParams, log, reply, correlationId }: LegacyResumeHandlerParams & { correlationId: string }): Promise<void> {
    const response = await resumeService(log).legacySyncResume({
        runId: flowRunId,
        payload: { body, headers, queryParams },
        correlationId,
    })
    await reply.status(response.status).headers(response.headers).send(response.body)
}

async function resolveResumePageTheme({ projectId, log }: { projectId: string, log: FastifyBaseLogger }): Promise<ResumePageTheme> {
    const platformId = await projectService(log).getPlatformId(projectId)
    return resumePageHooks.get(log).getTheme({ platformId })
}

async function resolveFlowName({ flowVersionId, log }: { flowVersionId: string, log: FastifyBaseLogger }): Promise<string | undefined> {
    const flowVersion = await flowVersionService(log).getOne(flowVersionId)
    return flowVersion?.displayName
}

function recordedMessageForAction(action: string | undefined): string {
    if (action === 'approve') {
        return 'You approved this request. You can close this page now.'
    }
    if (action === 'disapprove') {
        return 'You disapproved this request. You can close this page now.'
    }
    return RECORDED_MESSAGE
}

function renderPage({ theme, extra }: { theme: ResumePageTheme, extra: Record<string, unknown> }): string {
    return Mustache.render(PAGE_HTML_TEMPLATE, {
        websiteName: theme.websiteName,
        fullLogoUrl: theme.logos.fullLogoUrl,
        primaryColor: theme.colors.primary.default,
        ...extra,
    })
}

function acceptsHtml(headers: Record<string, string>): boolean {
    return (headers['accept'] ?? '').includes('text/html')
}

async function replyWithHtml({ reply, html, status }: { reply: FastifyReply, html: string, status?: number }): Promise<void> {
    await reply
        .status(status ?? StatusCodes.OK)
        .type('text/html')
        .header('Content-Security-Policy', RESUME_PAGE_CSP)
        .header('X-Content-Type-Options', 'nosniff')
        .header('Cache-Control', 'no-store')
        .send(html)
}

const ResumeByWaitpointRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: z.object({
            id: ApId,
            waitpointId: z.string(),
        }),
    },
}

const ConfirmSignalRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: z.object({
            id: ApId,
            signalId: ApId,
        }),
    },
}

const V0ResumeFlowRunRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: z.object({
            id: ApId,
            requestId: z.string(),
        }),
    },
}

const CONFIRM_TITLE = 'Confirm your response'
const CONFIRM_MESSAGE = 'A flow is paused and waiting for your response. Please confirm to continue.'

const REASON_REQUIRED_TITLE = 'A reason is required'
const REASON_REQUIRED_MESSAGE = 'This request needs a reason before it can be recorded. Go back, write one, and submit again.'
const REASON_TOO_LONG_TITLE = 'Your reason is too long'

const UNKNOWN_ACTION_TITLE = 'Nothing was recorded'
const UNKNOWN_ACTION_MESSAGE = 'This link needs to say whether you approve or disapprove. Open it in a browser and use one of the buttons — nothing was recorded.'

const RECORDED_MESSAGE = 'Your response has been recorded. You can close this page now.'
const EXPIRED_MESSAGE = 'This link has expired. The action may have already been processed.'
const RECORDED_TITLE = 'Response recorded'
const ALREADY_TITLE = 'Already responded'
const ALREADY_MESSAGE = 'This request has already been responded to. There is nothing left to do here.'

const ALREADY_RESPONDED = { title: ALREADY_TITLE, message: ALREADY_MESSAGE, success: false }

const RESUME_PAGE_CSP = 'default-src \'none\'; style-src \'unsafe-inline\'; form-action \'self\'; img-src \'self\' https: http: data:'

const RESUME_PAGE_STYLE = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0a0a0a; background: #fafafa; background-image: radial-gradient(#e4e4e7 1px, transparent 1px); background-size: 20px 20px; }
    .card { width: 440px; max-width: 100%; background: #fff; border: 1px solid #e5e5e5; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
    .head { padding: 28px 32px 0; }
    .logo { height: 24px; margin-bottom: 22px; }
    .badge { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .badge svg { width: 22px; height: 22px; }
    .badge-amber { background: #fffbeb; border: 1px solid #fde68a; color: #b45309; }
    .badge-green { background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; }
    h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.015em; margin: 0 0 8px; color: #0a0a0a; }
    p { font-size: 14px; line-height: 1.55; color: #737373; margin: 0 0 24px; }
    .chip { margin: 0 32px; padding: 12px 14px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
    .chip svg { width: 15px; height: 15px; color: #737373; flex-shrink: 0; }
    .chip .name { font-size: 12.5px; color: #404040; font-weight: 500; }
    .chip .state { margin-left: auto; font-size: 11px; color: #737373; }
    .actions { display: flex; gap: 10px; padding: 24px 32px 28px; margin: 0; }
    .btn { flex: 1; height: 36px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .btn svg { width: 14px; height: 14px; }
    .btn-destructive { background: #ef4444; }
    .reason { padding: 20px 32px 0; display: flex; flex-direction: column; gap: 6px; }
    .reason label { font-size: 12.5px; font-weight: 500; color: #404040; }
    .reason textarea { width: 100%; min-height: 76px; resize: vertical; padding: 10px 12px; border: 1px solid #e5e5e5; border-radius: 8px;
        font-family: inherit; font-size: 13px; line-height: 1.5; color: #0a0a0a; background: #fff; }
`

const CLOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
const CHECK_CIRCLE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
const ACTIVITY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
const X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

const PAGE_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{websiteName}}</title>
<style>${RESUME_PAGE_STYLE}</style>
</head>
<body>
<div class="card">
<div class="head">
{{#fullLogoUrl}}<img class="logo" src="{{fullLogoUrl}}" alt="{{websiteName}}">{{/fullLogoUrl}}
{{#success}}<div class="badge badge-green">${CHECK_CIRCLE_SVG}</div>{{/success}}
{{^success}}<div class="badge badge-amber">${CLOCK_SVG}</div>{{/success}}
<h1>{{title}}</h1>
<p>{{message}}</p>
</div>
{{#flowName}}
<div class="chip">${ACTIVITY_SVG}<span class="name">{{flowName}}</span><span class="state">Paused</span></div>
{{/flowName}}
{{#actions}}
<form method="POST">
{{#maxReasonLength}}
<div class="reason">
<label for="reason">Reason</label>
<textarea id="reason" name="reason" maxlength="{{maxReasonLength}}" placeholder="Why?"></textarea>
</div>
{{/maxReasonLength}}
<div class="actions">
<button type="submit" class="btn btn-destructive" formaction="{{disapproveUrl}}">${X_SVG}Disapprove</button>
<button type="submit" class="btn" style="background:{{primaryColor}}" formaction="{{approveUrl}}">${CHECK_SVG}Approve</button>
</div>
</form>
{{/actions}}
</div>
</body>
</html>`

type OpenSignal = {
    signal: WaitpointSignal
    barrier: Waitpoint
}

type ConfirmationPageParams = {
    flowRunId: string
    waitpointId: string
    url: string
    queryParams: Record<string, string>
    log: FastifyBaseLogger
    reply: FastifyReply
}

type SignalConfirmationPageParams = Omit<ConfirmationPageParams, 'waitpointId'> & {
    signalId: string
}

type ReplyWithConfirmationPageParams = Omit<ConfirmationPageParams, 'flowRunId' | 'waitpointId'> & {
    flowRun: FlowRun
    reasonField?: { maxReasonLength: number }
}

type ReplyWithAlreadyRespondedParams = {
    projectId: string
    log: FastifyBaseLogger
    reply: FastifyReply
}

type AsyncResumeHandlerParams = {
    flowRunId: string
    waitpointId: string
    body: unknown
    headers: Record<string, string>
    queryParams: Record<string, string>
    log: FastifyBaseLogger
    reply: FastifyReply
}

type ConfirmResumeParams = AsyncResumeHandlerParams & {
    action: string | undefined
}

type LegacyResumeHandlerParams = Omit<AsyncResumeHandlerParams, 'waitpointId'>

type SignalDecisionParams = Omit<ConfirmResumeParams, 'waitpointId' | 'queryParams'> & {
    signalId: string
}

type ResolveOpenSignalParams = {
    flowRunId: string
    signalId: string
    projectId: string
    flowRunStatus: FlowRunStatus
    log: FastifyBaseLogger
}

type IsReasonMissingParams = {
    reasonRequiredOn: 'none' | 'reject' | 'both' | undefined
    approved: boolean
    reason: string | undefined
}

type RespondToSignalDecisionParams = {
    reply: FastifyReply
    headers: Record<string, string>
    theme: ResumePageTheme
    status: number
    extra: { title: string, message: string, success: boolean }
}
