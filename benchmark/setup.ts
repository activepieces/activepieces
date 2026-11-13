#!/usr/bin/env bun
// Idempotent benchmark bootstrap. Replaces setup.sh.
//
// Entry contract (same as the old shell version):
//   stdout → FLOW_ID (one line)
//   stderr → progress log
//   exit 0 → success, non-zero → fatal
//
// Env (all optional):
//   BASE_URL                 default http://localhost:8080/api/v1
//   BENCH_EMAIL              default bench@activepieces.com
//   WEBHOOK_VERSION          default: resolved from /pieces at runtime
//   MATH_VERSION             default: resolved from /pieces at runtime
//   BENCH_API_KEY_FILE       opt-in. When set, mint an API key and write it mode 600.
//                            Smoke-test leaves it unset; /v1/api-keys is EE-only.
//   BENCH_PROJECT_ID_FILE    opt-in. When set, write the project id for downstream steps.
//   CODE_BODY_FILE           optional. Path to a custom CODE step body.
//   CODE_INPUT_SUM           default "{{step_3}}" — the add-step's output reference.
//   RESPONSE_BODY            default {"hello":"world"}. "{{step_2}}" is passed through
//                            as a template reference, anything else is parsed as JSON.
//   FLOW_ENABLE_TIMEOUT      default 120 seconds.

import { chmodSync, readFileSync, writeFileSync } from 'node:fs'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080/api/v1'
const BENCH_EMAIL = process.env.BENCH_EMAIL ?? 'bench@activepieces.com'
const BENCH_PASSWORD = 'BenchmarkPass1'
const FLOW_ENABLE_TIMEOUT_S = Number(process.env.FLOW_ENABLE_TIMEOUT ?? 120)

main().catch((err) => {
    log(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
})

async function main(): Promise<void> {
    await waitForApp()
    const auth = await authenticate()
    log(`Signed up. Project: ${auth.projectId}`)

    const versions = await resolvePieceVersions({ auth })
    await verifyPieceAvailable({ auth, name: '@activepieces/piece-webhook', version: versions.webhook })
    await verifyPieceAvailable({ auth, name: '@activepieces/piece-math-helper', version: versions.math })

    await maybeCreateApiKey({ auth })
    const flowId = await createEmptyFlow({ auth })
    log(`Flow created: ${flowId}`)

    await importFlow({ auth, flowId, versions })
    await publish({ auth, flowId })
    await enable({ auth, flowId })
    await waitForEnabled({ auth, flowId })

    maybeWriteProjectIdFile({ auth })

    log(`Setup complete. Flow ID: ${flowId}  Project ID: ${auth.projectId}`)
    process.stdout.write(`${flowId}\n`)
}

async function waitForApp(): Promise<void> {
    log('Waiting for app to be ready...')
    await retry({ attempts: 60, delayMs: 5000, name: 'wait-for-app /flags' }, async () => {
        const res = await safeFetch(`${BASE_URL}/flags`)
        return res?.ok ? true : undefined
    })
    log('App is ready')
}

async function authenticate(): Promise<Auth> {
    log('Authenticating...')
    const credentials = { email: BENCH_EMAIL, password: BENCH_PASSWORD }
    const signupBody = { ...credentials, firstName: 'Bench', lastName: 'Mark', trackEvents: false, newsLetter: false }

    // Sign-up is only valid for the first run (creates the platform). On repeat runs public
    // sign-up is disabled → fall back to sign-in with the same fixed credentials.
    const session = (await tryJsonPost<SessionResponse>({ path: '/authentication/sign-up', body: signupBody }))
        ?? (await tryJsonPost<SessionResponse>({ path: '/authentication/sign-in', body: credentials }))
    if (!session?.token) throw new Error('could not authenticate (sign-up and sign-in both failed)')

    let { token, projectId } = session

    // Cloud onboarding tokens return projectId=null; create a platform to get a USER token with one.
    if (!projectId) {
        log('Completing onboarding (creating platform + project)...')
        const platform = await jsonPost<SessionResponse>({ path: '/platforms', body: { name: 'Benchmark' }, auth: { token, projectId: '' } })
        token = platform.token
        projectId = platform.projectId
        if (!token || !projectId) throw new Error('platform create returned incomplete payload')
    }

    return { token, projectId }
}

async function resolvePieceVersions({ auth }: { auth: Auth }): Promise<PieceVersions> {
    let webhook = process.env.WEBHOOK_VERSION
    let math = process.env.MATH_VERSION
    if (webhook && math) return { webhook, math }

    log('Resolving piece versions from registry (polling /pieces up to 600s)...')
    await retry({ attempts: 600, delayMs: 1000, name: 'resolve piece versions' }, async () => {
        const pieces = (await jsonGet<PieceMeta[]>({ path: '/pieces', auth })) ?? []
        webhook = webhook ?? pieces.find((p) => p.name === '@activepieces/piece-webhook')?.version
        math = math ?? pieces.find((p) => p.name === '@activepieces/piece-math-helper')?.version
        return webhook && math ? true : undefined
    })
    log(`Resolved piece versions: webhook=${webhook} math-helper=${math}`)
    return { webhook: webhook!, math: math! }
}

async function verifyPieceAvailable({ auth, name, version }: { auth: Auth; name: string; version: string }): Promise<void> {
    log(`Waiting for ${name}@${version} to be available...`)
    await retry({ attempts: 600, delayMs: 1000, name: `wait ${name}@${version}` }, async () => {
        const path = `/pieces/${encodeURIComponent(name)}?version=${encodeURIComponent(version)}`
        const res = await safeFetch(`${BASE_URL}${path}`, { headers: authHeader(auth) })
        return res?.ok ? true : undefined
    })
}

async function maybeCreateApiKey({ auth }: { auth: Auth }): Promise<void> {
    const file = process.env.BENCH_API_KEY_FILE
    if (!file) return
    log('Creating platform API key for benchmark CLI...')
    const key = await jsonPost<{ value: string }>({ path: '/api-keys', body: { displayName: 'benchmark-cli' }, auth })
    if (!key?.value) throw new Error('API key creation returned empty value')
    writeFileSync(file, key.value, { mode: 0o600 })
    chmodSync(file, 0o600)
    log(`API key written to ${file} (mode 600)`)
}

function maybeWriteProjectIdFile({ auth }: { auth: Auth }): void {
    const file = process.env.BENCH_PROJECT_ID_FILE
    if (!file) return
    writeFileSync(file, auth.projectId)
    log(`Project ID written to ${file}`)
}

async function createEmptyFlow({ auth }: { auth: Auth }): Promise<string> {
    log('Creating flow...')
    const flow = await jsonPost<{ id: string }>({ path: '/flows', body: { displayName: 'Benchmark Flow', projectId: auth.projectId }, auth })
    return flow.id
}

async function importFlow({ auth, flowId, versions }: { auth: Auth; flowId: string; versions: PieceVersions }): Promise<void> {
    log('Importing flow definition...')
    await jsonPost<unknown>({
        path: `/flows/${flowId}`,
        body: buildImportRequest({
            versions,
            codeSrc: readCodeStepSrc(),
            sumInput: process.env.CODE_INPUT_SUM ?? '{{step_3}}',
            responseBody: resolveResponseBody(),
        }),
        auth,
    })
}

async function publish({ auth, flowId }: { auth: Auth; flowId: string }): Promise<void> {
    log('Publishing flow...')
    await jsonPost<unknown>({ path: `/flows/${flowId}`, body: { type: 'LOCK_AND_PUBLISH', request: {} }, auth })
}

async function enable({ auth, flowId }: { auth: Auth; flowId: string }): Promise<void> {
    log('Enabling flow...')
    await jsonPost<unknown>({ path: `/flows/${flowId}`, body: { type: 'CHANGE_STATUS', request: { status: 'ENABLED' } }, auth })
}

async function waitForEnabled({ auth, flowId }: { auth: Auth; flowId: string }): Promise<void> {
    log(`Waiting for flow to become ENABLED (timeout: ${FLOW_ENABLE_TIMEOUT_S}s)...`)
    for (let i = 1; i <= FLOW_ENABLE_TIMEOUT_S; i++) {
        const flow = await jsonGet<{ status: string }>({ path: `/flows/${flowId}`, auth })
        if (flow?.status === 'ENABLED') { log('Flow is ENABLED'); return }
        await delay(1000)
    }
    log(`WARNING: Flow still not ENABLED after ${FLOW_ENABLE_TIMEOUT_S}s, proceeding anyway`)
}

async function retry<T>({ attempts, delayMs, name }: { attempts: number; delayMs: number; name: string }, fn: () => Promise<T | undefined>): Promise<T> {
    for (let i = 1; i <= attempts; i++) {
        const result = await fn()
        if (result !== undefined) return result
        if (i === attempts) throw new Error(`${name}: no result after ${attempts} attempts`)
        await delay(delayMs)
    }
    throw new Error('unreachable')
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
    try { return await fetch(url, init) } catch { return null }
}

async function jsonGet<T>({ path, auth }: { path: string; auth: Auth }): Promise<T | undefined> {
    const res = await safeFetch(`${BASE_URL}${path}`, { headers: authHeader(auth) })
    if (!res?.ok) return undefined
    return (await res.json()) as T
}

async function jsonPost<T>({ path, body, auth }: { path: string; body: unknown; auth?: Auth }): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(auth ? authHeader(auth) : {}) },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status}): ${await res.text().catch(() => '')}`)
    return (await res.json()) as T
}

async function tryJsonPost<T>(args: { path: string; body: unknown; auth?: Auth }): Promise<T | undefined> {
    try { return await jsonPost<T>(args) } catch { return undefined }
}

function authHeader({ token }: Auth): Record<string, string> {
    return { authorization: `Bearer ${token}` }
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
}

function log(msg: string): void {
    process.stderr.write(`${msg}\n`)
}

function readCodeStepSrc(): string {
    const codeBodyFile = process.env.CODE_BODY_FILE
    if (!codeBodyFile) {
        return 'export const code = async (inputs) => {\n  return { result: Number(inputs.sum) + 1 };\n};\n'
    }
    try { return readFileSync(codeBodyFile, 'utf8') }
    catch { throw new Error(`CODE_BODY_FILE=${codeBodyFile} not found`) }
}

function resolveResponseBody(): unknown {
    const raw = process.env.RESPONSE_BODY
    if (!raw) return { hello: 'world' }
    if (raw === '{{step_2}}') return '{{step_2}}'
    return JSON.parse(raw)
}

function buildImportRequest({ versions, codeSrc, sumInput, responseBody }: BuildImportOpts): object {
    return {
        type: 'IMPORT_FLOW',
        request: {
            displayName: 'Benchmark Flow',
            schemaVersion: '17',
            notes: [],
            trigger: {
                name: 'trigger',
                valid: true,
                displayName: 'Catch Webhook',
                type: 'PIECE_TRIGGER',
                settings: {
                    pieceName: '@activepieces/piece-webhook',
                    pieceVersion: versions.webhook,
                    triggerName: 'catch_webhook',
                    input: { authType: 'none', authFields: {} },
                    propertySettings: {
                        authType: { type: 'MANUAL' },
                        authFields: { type: 'MANUAL', schema: {} },
                        liveMarkdown: { type: 'MANUAL' },
                        syncMarkdown: { type: 'MANUAL' },
                        testMarkdown: { type: 'MANUAL' },
                    },
                    sampleData: {},
                },
                nextAction: buildMathStep({
                    mathVersion: versions.math,
                    nextAction: buildCodeStep({
                        codeSrc,
                        sumInput,
                        nextAction: buildReturnResponseStep({ webhookVersion: versions.webhook, responseBody }),
                    }),
                }),
            },
        },
    }
}

function buildMathStep({ mathVersion, nextAction }: { mathVersion: string; nextAction: object }): object {
    return {
        name: 'step_3',
        skip: false,
        type: 'PIECE',
        valid: true,
        displayName: 'Add',
        settings: {
            input: { first_number: 2, second_number: 3 },
            pieceName: '@activepieces/piece-math-helper',
            actionName: 'addition_math',
            pieceVersion: mathVersion,
            sampleData: {},
            propertySettings: {
                first_number: { type: 'MANUAL' },
                second_number: { type: 'MANUAL' },
            },
            errorHandlingOptions: NO_RETRY,
        },
        nextAction,
    }
}

function buildCodeStep({ codeSrc, sumInput, nextAction }: { codeSrc: string; sumInput: string; nextAction: object }): object {
    return {
        name: 'step_2',
        skip: false,
        type: 'CODE',
        valid: true,
        displayName: 'Code',
        settings: {
            input: { sum: sumInput },
            sampleData: {},
            sourceCode: { code: codeSrc, packageJson: '{}' },
            errorHandlingOptions: NO_RETRY,
        },
        nextAction,
    }
}

function buildReturnResponseStep({ webhookVersion, responseBody }: { webhookVersion: string; responseBody: unknown }): object {
    return {
        name: 'step_1',
        skip: false,
        type: 'PIECE',
        valid: true,
        displayName: 'Return Response',
        settings: {
            input: {
                fields: { body: responseBody, status: 200, headers: {} },
                respond: 'stop',
                responseType: 'json',
            },
            pieceName: '@activepieces/piece-webhook',
            actionName: 'return_response',
            sampleData: {},
            pieceVersion: webhookVersion,
            propertySettings: {
                fields: {
                    type: 'MANUAL',
                    schema: {
                        body: { type: 'JSON', required: true, displayName: 'JSON Body' },
                        status: { type: 'NUMBER', required: false, displayName: 'Status', defaultValue: 200 },
                        headers: { type: 'OBJECT', required: false, displayName: 'Headers' },
                    },
                },
                respond: { type: 'MANUAL' },
                responseType: { type: 'MANUAL' },
            },
            errorHandlingOptions: NO_RETRY,
        },
    }
}

const NO_RETRY = { retryOnFailure: { value: false }, continueOnFailure: { value: false } }

type Auth = { token: string; projectId: string }
type SessionResponse = { token: string; projectId: string }
type PieceMeta = { name: string; version: string }
type PieceVersions = { webhook: string; math: string }
type BuildImportOpts = { versions: PieceVersions; codeSrc: string; sumInput: string; responseBody: unknown }
