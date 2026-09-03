import { ActionBase, PieceMetadataModel, TriggerBase } from '@activepieces/pieces-framework'
import { PackageType, PieceType, SuggestionType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { PieceMetadataSchema } from '../../src/app/pieces/metadata/piece-metadata-entity'
import { pieceSearching } from '../../src/app/pieces/metadata/utils/piece-searching'

function buildAction({ name, displayName, description }: { name: string, displayName: string, description: string }): ActionBase {
    return {
        name,
        displayName,
        description,
        props: {},
        requireAuth: true,
    }
}

function buildTrigger({ name, displayName, description }: { name: string, displayName: string, description: string }): TriggerBase {
    return {
        ...buildAction({ name, displayName, description }),
        type: TriggerStrategy.POLLING,
        testStrategy: TriggerTestStrategy.SIMULATION,
        sampleData: {},
    }
}

function buildPiece({ name, displayName, description, actions, triggers = [] }: {
    name: string
    displayName: string
    description: string
    actions: ActionBase[]
    triggers?: TriggerBase[]
}): PieceMetadataSchema {
    const actionMap: PieceMetadataModel['actions'] = Object.fromEntries(
        actions.map((action) => [action.name, action]),
    )
    const triggerMap: PieceMetadataModel['triggers'] = Object.fromEntries(
        triggers.map((trigger) => [trigger.name, trigger]),
    )
    return {
        id: name,
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        name,
        displayName,
        description,
        logoUrl: 'https://cdn.activepieces.com/logo.png',
        authors: [],
        version: '1.0.0',
        contextInfo: undefined,
        actions: actionMap,
        triggers: triggerMap,
        projectUsage: 0,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    }
}

const slack = buildPiece({
    name: '@activepieces/piece-slack',
    displayName: 'Slack',
    description: 'Channel-based messaging platform',
    actions: [
        buildAction({ name: 'send_channel_message', displayName: 'Send Message To A Channel', description: 'Send message to a channel' }),
        buildAction({ name: 'send_direct_message', displayName: 'Send Message To A User', description: 'Send message to a user' }),
        buildAction({ name: 'delete_message', displayName: 'Delete Message', description: 'Delete an existing message' }),
        buildAction({ name: 'create_channel', displayName: 'Create Channel', description: 'Create a new channel' }),
        buildAction({ name: 'find_user_by_email', displayName: 'Find User by Email', description: 'Find a user by email' }),
    ],
})

const gmail = buildPiece({
    name: '@activepieces/piece-gmail',
    displayName: 'Gmail',
    description: 'Email service by Google',
    actions: [
        buildAction({ name: 'send_email', displayName: 'Send Email', description: 'Send an email' }),
    ],
})

const formstack = buildPiece({
    name: '@activepieces/piece-formstack',
    displayName: 'Formstack',
    description: 'Online form builder',
    actions: [
        buildAction({ name: 'create_submission', displayName: 'Create Submission', description: 'Create a form submission' }),
        buildAction({ name: 'find_form', displayName: 'Find Form by Name or ID', description: 'Find a form by name or id' }),
    ],
    triggers: [
        buildTrigger({ name: 'new_submission', displayName: 'New Submission', description: 'Triggers when a form receives a new submission' }),
        buildTrigger({ name: 'new_form', displayName: 'New Form', description: 'Triggers when a new form is created' }),
    ],
})

const googleSheets = buildPiece({
    name: '@activepieces/piece-google-sheets',
    displayName: 'Google Sheets',
    description: 'Spreadsheets by Google',
    actions: [
        buildAction({ name: 'insert_row', displayName: 'Insert Row', description: 'Append a row to a sheet' }),
        buildAction({ name: 'find_row', displayName: 'Find Row', description: 'Find a row in a sheet' }),
    ],
})

const allPieces = [slack, gmail, formstack, googleSheets]

function search(searchQuery: string): PieceMetadataSchema[] {
    return pieceSearching.search({
        categories: undefined,
        searchQuery,
        pieces: allPieces,
        suggestionType: SuggestionType.ACTION,
    })
}

function searchTriggers(searchQuery: string): PieceMetadataSchema[] {
    return pieceSearching.search({
        categories: undefined,
        searchQuery,
        pieces: allPieces,
        suggestionType: SuggestionType.TRIGGER,
    })
}

function suggestedActionNames(piece: PieceMetadataSchema): string[] {
    return Object.values(piece.actions).map((action) => action.displayName)
}

function suggestedTriggerNames(piece: PieceMetadataSchema): string[] {
    return Object.values(piece.triggers).map((trigger) => trigger.displayName)
}

describe('pieceSearching.search', () => {
    it('returns the piece with its matching actions when the query names both the piece and the action', () => {
        const results = search('slack message')

        expect(results.map((piece) => piece.displayName)).toEqual(['Slack'])
        expect(suggestedActionNames(results[0]).sort()).toEqual([
            'Delete Message',
            'Send Message To A Channel',
            'Send Message To A User',
        ])
    })

    it('narrows to a single action when the query names the piece and that action', () => {
        const results = search('slack delete message')

        expect(results.map((piece) => piece.displayName)).toEqual(['Slack'])
        expect(suggestedActionNames(results[0])).toEqual(['Delete Message'])
    })

    it('returns every action when the query is only the piece name', () => {
        const results = search('slack')

        expect(results[0].displayName).toEqual('Slack')
        expect(suggestedActionNames(results[0])).toHaveLength(5)
    })

    it('narrows by action name when the query does not mention the piece', () => {
        const results = search('send message')

        expect(results.map((piece) => piece.displayName)).toEqual(['Slack'])
        expect(suggestedActionNames(results[0]).sort()).toEqual([
            'Send Message To A Channel',
            'Send Message To A User',
        ])
    })

    it('returns the matching trigger when the query names the piece and the trigger', () => {
        const results = searchTriggers('formstack submission')

        expect(results.map((piece) => piece.displayName)).toEqual(['Formstack'])
        expect(suggestedTriggerNames(results[0])).toEqual(['New Submission'])
    })

    it('keeps a trigger search off the action names', () => {
        const results = searchTriggers('create submission')

        expect(results.map((piece) => piece.displayName)).toEqual([])
    })

    it('keeps at least one suggestion whenever the whole piece name is typed, so the web cannot filter it away', () => {
        for (const [query, expected] of [['slack message', 'Slack'], ['slack zzzz', 'Slack'], ['gmail send email', 'Gmail']]) {
            const piece = search(query).find((result) => result.displayName === expected)

            expect(piece, `${query} -> ${expected}`).toBeDefined()
            expect(Object.keys(piece?.actions ?? {}).length, `${query} -> ${expected}`).toBeGreaterThan(0)
        }
    })

    it('suggests nothing for a token that only appears in the npm package name', () => {
        for (const query of ['piece', 'activepieces']) {
            for (const piece of search(query)) {
                expect(Object.keys(piece.actions).length, `${query} -> ${piece.displayName}`).toEqual(0)
            }
        }
    })

    it('suggests nothing for a partially named piece whose remaining query matches nothing', () => {
        const googleSheetsResult = search('google vertex image').find((piece) => piece.displayName === 'Google Sheets')

        expect(Object.keys(googleSheetsResult?.actions ?? {})).toEqual([])
    })

    it('returns nothing when the query matches no piece', () => {
        expect(search('zzzz')).toEqual([])
    })

    it('returns every piece unchanged when there is no query', () => {
        const results = pieceSearching.search({
            categories: undefined,
            searchQuery: undefined,
            pieces: allPieces,
            suggestionType: SuggestionType.ACTION,
        })

        expect(results).toEqual(allPieces)
    })
})
