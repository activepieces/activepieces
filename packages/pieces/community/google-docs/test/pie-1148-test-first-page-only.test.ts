import { describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, Store, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test'

type Page = { files: Record<string, unknown>[], nextPageToken?: string }
type Fake = { pages: Page[], calls: Record<string, unknown>[] }

const fake = vi.hoisted((): Fake => ({ pages: [], calls: [] }))

vi.mock('@googleapis/drive', () => ({
    drive_v3: {},
    drive: () => ({
        files: {
            list: async (params: Record<string, unknown>) => {
                fake.calls.push(params)
                const index = params['pageToken'] ? Number(String(params['pageToken']).replace('page-', '')) : 0
                const page = fake.pages[index] ?? { files: [] }
                return { data: { kind: 'drive#fileList', files: page.files, nextPageToken: page.nextPageToken } }
            },
        },
    }),
}))

import { newDocumentTrigger } from '../src/lib/triggers/new-document'
import { googleDocsAuth } from '../src/lib/auth'

function pollingTrigger() {
    if (newDocumentTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('New Document is expected to be a polling trigger')
    }
    return newDocumentTrigger
}

const trigger = pollingTrigger()

type TriggerContext = Parameters<typeof trigger.test>[0]

const hoursAgo = ({ hours }: { hours: number }) => new Date(Date.now() - hours * 3_600_000).toISOString()

const hasId = (value: unknown): value is { id: string } =>
    typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'

const ids = ({ events }: { events: unknown[] }): string[] =>
    events.map((event) => {
        if (!hasId(event)) {
            throw new Error(`event without a string id: ${JSON.stringify(event)}`)
        }
        return event.id
    })

function memoryStore() {
    const data = new Map<string, string>()
    const store: Store = {
        put: async <T>(key: string, value: T) => {
            data.set(key, JSON.stringify(value))
            return value
        },
        get: async <T>(key: string): Promise<T | null> => {
            const raw = data.get(key)
            if (raw === undefined) {
                return null
            }
            return JSON.parse(raw)
        },
        delete: async (key: string) => {
            data.delete(key)
        },
    }
    const read = ({ key }: { key: string }): unknown => {
        const raw = data.get(key)
        return raw === undefined ? undefined : JSON.parse(raw)
    }
    return { store, read }
}

const auth: AppConnectionValueForAuthProperty<typeof googleDocsAuth> = {
    type: AppConnectionType.OAUTH2,
    access_token: 'ya29.test',
    refresh_token: 'refresh-test',
    client_id: 'client-test',
    client_secret: 'secret-test',
    redirect_url: 'http://localhost/redirect',
    token_type: 'Bearer',
    claimed_at: 0,
    scope: '',
    token_url: 'https://oauth2.googleapis.com/token',
    data: {},
}

const hookContext = ({ store, isRepublish }: { store: Store, isRepublish?: boolean }): TriggerContext => ({
    ...createMockPollingTriggerContext({ propsValue: { folderId: undefined } }),
    auth,
    propsValue: { folderId: undefined },
    store,
    isRepublish,
    files: {
        write: async () => 'file-url',
        upload: async () => ({ id: 'file-id', url: 'file-url' }),
    },
})

describe('PIE-1148 Docs New Document test() stops after the first files.list page', () => {
    it('an empty first page with nextPageToken still yields the document on page 2', async () => {
        fake.calls.length = 0
        fake.pages = [
            { files: [], nextPageToken: 'page-1' },
            { files: [{ kind: 'drive#file', id: 'doc-1', name: 'Proposal ACME', mimeType: 'application/vnd.google-apps.document', createdTime: hoursAgo({ hours: 2 }) }] },
        ]
        const { store } = memoryStore()
        const sample = await trigger.test(hookContext({ store }))
        expect(ids({ events: sample })).toEqual(['doc-1'])
        expect(fake.calls).toHaveLength(2)
    })
})
