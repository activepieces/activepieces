import { PropertyType } from '@activepieces/pieces-framework'
import { describe, expect, it } from 'vitest'
import { mcpUtils } from '../../../../src/app/mcp/tools/mcp-utils'

function shortText(displayName: string) {
    return { type: PropertyType.SHORT_TEXT, displayName, required: false }
}

describe('mcpUtils.diagnosePieceProps — unknown property suggestions', () => {
    it('suggests the containing key when an abbreviation is passed (scope → store_scope)', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope'), key: shortText('Key') },
            input: { scope: 'PROJECT', key: 'k' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toContain('scope')
        const text = diagnosis.parts.join('\n')
        expect(text).toContain('did you mean \'store_scope\'?')
    })

    it('suggests the closest key for a typo within edit-distance threshold', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope') },
            input: { store_scop: 'PROJECT' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.parts.join('\n')).toContain('did you mean \'store_scope\'?')
    })

    it('does not invent a suggestion for an unrelated unknown key', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope') },
            input: { xyz: '1' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toContain('xyz')
        expect(diagnosis.parts.join('\n')).not.toContain('did you mean')
    })

    it('reports no unknown keys for a fully valid input', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { store_scope: shortText('Store Scope'), key: shortText('Key') },
            input: { store_scope: 'PROJECT', key: 'k' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.unknownKeys).toEqual([])
    })
})

describe('mcpUtils.flattenOutputSchemaFields — declared output schema → reference paths', () => {
    it('flattens nested objects, arrays, formats, and dynamic keys', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'id', format: 'number' },
            { key: 'author', children: [{ key: 'name' }, { key: 'email', format: 'email' }] },
            { key: 'messages', listItems: [{ key: 'text' }] },
            { key: 'dyn', dynamicKey: true },
        ])
        expect(paths).toEqual([
            'id (number)',
            'author.name',
            'author.email (email)',
            'messages[].text',
            'dyn (dynamic key)',
        ])
    })

    it('returns an empty list when there are no fields', () => {
        expect(mcpUtils.flattenOutputSchemaFields([])).toEqual([])
    })

    it('flattens arbitrarily deep schemas without dropping fields', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'l1', children: [{ key: 'l2', children: [{ key: 'l3', children: [{ key: 'l4', children: [{ key: 'l5', children: [{ key: 'l6', format: 'number' }] }] }] }] }] },
        ])
        expect(paths).toEqual(['l1.l2.l3.l4.l5.l6 (number)'])
    })

    it('drops the wrapper key of a root-array schema (value: "" means the whole output)', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'rows', value: '', listItems: [{ key: 'row' }, { key: 'rowIndex', format: 'number' }] },
        ])
        // Real output is the array itself — there is no `rows` property to nest under.
        expect(paths).toEqual(['[].row', '[].rowIndex (number)'])
    })

    it('exports the value path (not the key) when they differ, mirroring the builder', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'startDateTime', value: 'start.dateTime', format: 'datetime' },
        ])
        expect(paths).toEqual(['start.dateTime (datetime)'])
    })

    it('resolves a nested value path relative to its parent prefix', () => {
        const paths = mcpUtils.flattenOutputSchemaFields([
            { key: 'event', children: [{ key: 'startDateTime', value: 'start.dateTime' }] },
        ])
        expect(paths).toEqual(['event.start.dateTime'])
    })
})

describe('mcpUtils.deriveFieldPathsFromSample — trigger sample data → reference paths', () => {
    it('derives typed paths from a nested sample object with arrays', () => {
        const paths = mcpUtils.deriveFieldPathsFromSample({
            action: 'opened',
            issue: { id: 5, title: 'Bug', user: { login: 'octocat' } },
            labels: [{ name: 'bug' }],
        })
        expect(paths).toContain('action (string)')
        expect(paths).toContain('issue.id (number)')
        expect(paths).toContain('issue.title (string)')
        expect(paths).toContain('issue.user.login (string)')
        expect(paths).toContain('labels[].name (string)')
    })

    it('returns an empty list for an empty sample object', () => {
        expect(mcpUtils.deriveFieldPathsFromSample({})).toEqual([])
    })
})

function objectProp({ displayName, required }: { displayName: string, required: boolean }) {
    return { type: PropertyType.OBJECT, displayName, required }
}

function arrayProp({ displayName, required }: { displayName: string, required: boolean }) {
    return { type: PropertyType.ARRAY, displayName, required }
}

describe('mcpUtils.coerceEmptyContainerInputs — empty-able containers mean "none"', () => {
    it('fills a missing required OBJECT with {} and a missing required ARRAY with []', () => {
        const coerced = mcpUtils.coerceEmptyContainerInputs({
            props: {
                headers: objectProp({ displayName: 'Headers', required: true }),
                queryParams: objectProp({ displayName: 'Query Params', required: true }),
                tags: arrayProp({ displayName: 'Tags', required: true }),
            },
            input: { url: 'https://api.example.com' },
        })
        expect(coerced.headers).toEqual({})
        expect(coerced.queryParams).toEqual({})
        expect(coerced.tags).toEqual([])
        expect(coerced.url).toBe('https://api.example.com')
    })

    it('does not overwrite a container the caller already provided', () => {
        const coerced = mcpUtils.coerceEmptyContainerInputs({
            props: { headers: objectProp({ displayName: 'Headers', required: true }) },
            input: { headers: { 'Content-Type': 'application/json' } },
        })
        expect(coerced.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('normalizes an empty wrong-shape container (empty [] for an OBJECT prop → {}, empty {} for an ARRAY prop → [])', () => {
        const coerced = mcpUtils.coerceEmptyContainerInputs({
            props: {
                headers: objectProp({ displayName: 'Headers', required: true }),
                queryParams: objectProp({ displayName: 'Query Params', required: true }),
                tags: arrayProp({ displayName: 'Tags', required: true }),
            },
            input: { headers: [], queryParams: [], tags: {} },
        })
        expect(coerced.headers).toEqual({})
        expect(coerced.queryParams).toEqual({})
        expect(coerced.tags).toEqual([])
    })

    it('does not clobber a non-empty wrong-shape value (leaves it for validation to flag)', () => {
        const coerced = mcpUtils.coerceEmptyContainerInputs({
            props: { headers: objectProp({ displayName: 'Headers', required: true }) },
            input: { headers: [{ key: 'X-Test', value: '1' }] },
        })
        expect(coerced.headers).toEqual([{ key: 'X-Test', value: '1' }])
    })

    it('does not touch non-container props (a missing required URL still surfaces downstream)', () => {
        const coerced = mcpUtils.coerceEmptyContainerInputs({
            props: { url: shortText('URL') },
            input: {},
        })
        expect(coerced.url).toBeUndefined()
    })
})

describe('mcpUtils.diagnosePieceProps — container coercion + hybrid teaching', () => {
    it('after coercion, required OBJECT/ARRAY are no longer flagged as missing', () => {
        const props = {
            url: { type: PropertyType.SHORT_TEXT, displayName: 'URL', required: true },
            headers: objectProp({ displayName: 'Headers', required: true }),
            queryParams: objectProp({ displayName: 'Query Params', required: true }),
        }
        const input = mcpUtils.coerceEmptyContainerInputs({ props, input: { url: 'https://api.example.com' } })
        const diagnosis = mcpUtils.diagnosePieceProps({ props, input, pieceAuth: undefined, requireAuth: false, componentType: 'action' })
        expect(diagnosis.missing).toEqual([])
    })

    it('still flags a genuinely-missing required scalar and includes its description', () => {
        const props = {
            url: { type: PropertyType.SHORT_TEXT, displayName: 'URL', required: true, description: 'The endpoint to call' },
            headers: objectProp({ displayName: 'Headers', required: true }),
        }
        const input = mcpUtils.coerceEmptyContainerInputs({ props, input: {} })
        const diagnosis = mcpUtils.diagnosePieceProps({ props, input, pieceAuth: undefined, requireAuth: false, componentType: 'action' })
        expect(diagnosis.missing.length).toBe(1)
        const text = diagnosis.parts.join('\n')
        expect(text).toContain('url')
        expect(text).toContain('The endpoint to call')
    })

    it('directs the agent to resolve dropdown/dynamic fields via tools (not the UI)', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { objectTypeId: { type: PropertyType.DROPDOWN, displayName: 'Object Type', required: true } },
            input: {},
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        const text = diagnosis.parts.join('\n')
        expect(text).toContain('ap_resolve_property_options')
        expect(text).not.toContain('Activepieces UI')
    })
})

describe('mcpUtils.buildRequiredInputs / buildExampleInput — prepare-to-execute output', () => {
    const props = [
        { name: 'url', type: PropertyType.SHORT_TEXT, displayName: 'URL', required: true },
        { name: 'method', type: PropertyType.STATIC_DROPDOWN, displayName: 'Method', required: true, options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }] },
        { name: 'headers', type: PropertyType.OBJECT, displayName: 'Headers', required: true },
        { name: 'queryParams', type: PropertyType.OBJECT, displayName: 'Query Params', required: true },
        { name: 'objectTypeId', type: PropertyType.DROPDOWN, displayName: 'Object Type', required: true },
        { name: 'body', type: PropertyType.JSON, displayName: 'Body', required: false },
    ]

    it('splits required inputs into provideNow vs needsResolution (dropdowns/dynamic)', () => {
        const { provideNow, needsResolution } = mcpUtils.buildRequiredInputs(props)
        expect(provideNow).toContain('url')
        expect(provideNow).toContain('headers')
        expect(provideNow).toContain('method')
        expect(needsResolution).toEqual(['objectTypeId'])
    })

    it('builds an example with empty containers, a first dropdown option, and a resolution sentinel for unresolved dropdowns', () => {
        const example = mcpUtils.buildExampleInput(props)
        expect(example.headers).toEqual({})
        expect(example.queryParams).toEqual({})
        expect(example.method).toBe('GET')
        expect(example.objectTypeId).toContain('resolve with ap_resolve_property_options')
        expect(example).not.toHaveProperty('body')
    })

    it('uses a resolved dropdown option value when options are present', () => {
        const example = mcpUtils.buildExampleInput([
            { name: 'objectTypeId', type: PropertyType.DROPDOWN, displayName: 'Object Type', required: true, options: [{ label: 'Deals', value: 'deal-uuid' }] },
        ])
        expect(example.objectTypeId).toBe('deal-uuid')
    })
})

function staticDropdown({ displayName, required, values }: { displayName: string, required: boolean, values: string[] }) {
    return {
        type: PropertyType.STATIC_DROPDOWN,
        displayName,
        required,
        options: { options: values.map((v) => ({ label: v, value: v })) },
    }
}

describe('mcpUtils.diagnosePieceProps — static dropdown value validation', () => {
    it('flags a value that is not among the allowed options and lists the valid values', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { body_type: staticDropdown({ displayName: 'Body Type', required: false, values: ['none', 'json', 'raw', 'form_data'] }) },
            input: { body_type: 'JSON' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.invalidEnums.length).toBe(1)
        const text = diagnosis.parts.join('\n')
        expect(text).toContain('Invalid option values')
        expect(text).toContain('body_type')
        expect(text).toContain('json')
    })

    it('accepts a value that matches an allowed option', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { body_type: staticDropdown({ displayName: 'Body Type', required: false, values: ['none', 'json', 'raw'] }) },
            input: { body_type: 'json' },
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.invalidEnums).toEqual([])
    })

    it('flags an empty required dropdown as missing (not as an invalid enum) and shows the options', () => {
        const diagnosis = mcpUtils.diagnosePieceProps({
            props: { authType: staticDropdown({ displayName: 'Authentication', required: true, values: ['NONE', 'BASIC', 'BEARER_TOKEN'] }) },
            input: {},
            pieceAuth: undefined,
            requireAuth: false,
            componentType: 'action',
        })
        expect(diagnosis.invalidEnums).toEqual([])
        expect(diagnosis.missing.length).toBe(1)
        expect(diagnosis.parts.join('\n')).toContain('NONE')
    })
})

describe('mcpUtils.classifyActionCardinality', () => {
    it('classifies find-one / get actions as single', () => {
        for (const name of ['find_record', 'find_list_entry', 'get_contact', 'get_row', 'retrieve_invoice', 'lookup_user']) {
            expect(mcpUtils.classifyActionCardinality(name), name).toBe('single')
        }
    })

    it('classifies list/search and plural-find actions as enumerate', () => {
        for (const name of ['list_records', 'search_records', 'list_contacts', 'find_records', 'search_emails', 'list_rows']) {
            expect(mcpUtils.classifyActionCardinality(name), name).toBe('enumerate')
        }
    })

    it('classifies writes and everything else as other', () => {
        for (const name of ['create_record', 'send_message', 'update_row', 'delete_contact', 'make_call']) {
            expect(mcpUtils.classifyActionCardinality(name), name).toBe('other')
        }
    })
})

describe('mcpUtils.rankActionsByIntent — cardinality bias', () => {
    const actions = [
        { name: 'find_record', displayName: 'Find Record', description: 'Find a company record', cardinality: 'single' as const },
        { name: 'list_records', displayName: 'List Records', description: 'List company records', cardinality: 'enumerate' as const },
        { name: 'create_record', displayName: 'Create Record', description: 'Create a company record', cardinality: 'other' as const },
    ]

    it('ranks the enumerate action first for a "show all" intent', () => {
        const ranked = mcpUtils.rankActionsByIntent({ actions, forIntent: 'show me all my companies' })
        expect(ranked[0]).toBe('list_records')
        expect(ranked.indexOf('list_records')).toBeLessThan(ranked.indexOf('find_record') === -1 ? Infinity : ranked.indexOf('find_record'))
    })

    it('does not apply the enumerate bias for a single-item intent', () => {
        const ranked = mcpUtils.rankActionsByIntent({ actions, forIntent: 'find the company record for Acme' })
        expect(ranked).toContain('find_record')
    })
})

describe('mcpUtils.resolveTransitively — collapse the discovery chain', () => {
    it('resolves a dependent chain (base → table → fields) in one pass and seeds parent values', async () => {
        const props = [
            { name: 'base', type: PropertyType.DROPDOWN, displayName: 'Base', required: true },
            { name: 'table', type: PropertyType.DROPDOWN, displayName: 'Table', required: true },
            { name: 'fields', type: PropertyType.DYNAMIC, displayName: 'Fields', required: true },
        ]
        const componentProps = {
            base: { type: PropertyType.DROPDOWN, refreshers: ['auth'] },
            table: { type: PropertyType.DROPDOWN, refreshers: ['base'] },
            fields: { type: PropertyType.DYNAMIC, refreshers: ['base', 'table'] },
        }
        const seenInputs = {}
        const resolveOne = async ({ prop, input }) => {
            seenInputs[prop.name] = { ...input }
            if (prop.name === 'fields') {
                return { status: 'dynamic', props: { city: { type: PropertyType.SHORT_TEXT, displayName: 'City', required: false } } }
            }
            return { status: 'options', options: [{ label: `${prop.name}-one`, value: `${prop.name}-1` }] }
        }

        await mcpUtils.resolveTransitively({ props, componentProps, auth: 'conn-1', providedInput: {}, resolveOne })

        // All three resolved in the single call.
        expect(props[0].options?.[0].value).toBe('base-1')
        expect(props[1].options?.[0].value).toBe('table-1')
        expect(props[2].dynamicFields?.map((f) => f.name)).toEqual(['city'])
        // table was only resolvable AFTER base's first option was seeded into the input.
        expect(seenInputs.table.base).toBe('base-1')
        expect(seenInputs.fields.table).toBe('table-1')
    })

    it('never overrides a value the caller actually provided', async () => {
        const props = [
            { name: 'base', type: PropertyType.DROPDOWN, displayName: 'Base', required: true },
            { name: 'table', type: PropertyType.DROPDOWN, displayName: 'Table', required: true },
        ]
        const componentProps = {
            base: { type: PropertyType.DROPDOWN, refreshers: ['auth'] },
            table: { type: PropertyType.DROPDOWN, refreshers: ['base'] },
        }
        const seen = {}
        const resolveOne = async ({ prop, input }) => {
            seen[prop.name] = { ...input }
            return { status: 'options', options: [{ label: 'x', value: `${prop.name}-auto` }] }
        }
        await mcpUtils.resolveTransitively({ props, componentProps, auth: 'c', providedInput: { base: 'user-chosen' }, resolveOne })
        expect(seen.table.base).toBe('user-chosen')
    })
})

describe('mcpUtils.buildExampleInput — runnable, sentinel-free once resolved', () => {
    it('uses the first resolved option (not a <resolve…> sentinel) and recurses dynamic sub-fields', () => {
        const props = [
            { name: 'channel', type: PropertyType.DROPDOWN, displayName: 'Channel', required: true, options: [{ label: 'general', value: 'C123' }] },
            { name: 'fields', type: PropertyType.DYNAMIC, displayName: 'Fields', required: true, dynamicFields: [
                { name: 'name', type: PropertyType.SHORT_TEXT, displayName: 'Name', required: true },
            ] },
        ]
        const example = mcpUtils.buildExampleInput(props)
        const serialized = JSON.stringify(example)
        expect(serialized).not.toContain('resolve with')
        expect(example.channel).toBe('C123')
        expect(example.fields).toEqual({ name: '<Name>' })
    })
})
