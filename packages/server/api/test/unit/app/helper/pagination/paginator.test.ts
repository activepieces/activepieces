import { EntitySchema, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import Paginator, { Order } from '../../../../../src/app/helper/pagination/paginator'
import { atob, btoa, encodeByType } from '../../../../../src/app/helper/pagination/pagination-utils'

function createMockEntity(columns: Record<string, { type: unknown }>): EntitySchema {
    return {
        options: {
            name: 'test_entity',
            columns,
        },
    } as unknown as EntitySchema
}

const DEFAULT_COLUMNS = {
    id: { type: String },
    created: { type: 'timestamp with time zone' },
    updated: { type: 'timestamp with time zone' },
}

function createMockQueryBuilder<Entity extends ObjectLiteral>(
    entities: Entity[],
    raw?: Record<string, unknown>[],
): SelectQueryBuilder<Entity> {
    const rawData = raw ?? entities.map((e) => {
        const rawRow: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(e)) {
            rawRow[`test_entity_${key}`] = value
        }
        return rawRow
    })

    const mockBuilder = {
        andWhere: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getRawAndEntities: vi.fn().mockResolvedValue({
            entities,
            raw: rawData,
        }),
        expressionMap: {
            clone: vi.fn().mockReturnValue({}),
            mainAlias: { name: 'test_entity' },
        },
        connection: {},
    } as unknown as SelectQueryBuilder<Entity>

    return mockBuilder
}

vi.mock('typeorm', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return {
        ...actual,
        SelectQueryBuilder: vi.fn().mockImplementation((original: unknown) => {
            return original
        }),
    }
})

describe('Paginator', () => {
    const TIMESTAMP = '2025-09-22T10:18:10.000Z'

    function makeEntities(count: number, timestamp: string = TIMESTAMP): Array<{ id: string, created: string }> {
        return Array.from({ length: count }, (_, i) => ({
            id: `id_${String(i + 1).padStart(3, '0')}`,
            created: timestamp,
        }))
    }

    describe('encode/decode cursor with id', () => {
        it('should encode both created and id into the cursor', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(2)
            paginator.setOrder(Order.DESC)

            const entities = makeEntities(3)
            const builder = createMockQueryBuilder(entities)

            const result = await paginator.paginate(builder)

            // hasMore=true (3 > 2), so afterCursor is set from last item in trimmed data
            expect(result.data).toHaveLength(2)
            expect(result.cursor.afterCursor).not.toBeNull()

            // Decode the cursor and verify it contains both created and id
            const rawCursor = result.cursor.afterCursor!
            const decoded = atob(rawCursor)
            expect(decoded).toContain('created:')
            expect(decoded).toContain(',id:')
        })

        it('should produce a cursor that decodes back to created and id values', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(1)
            paginator.setOrder(Order.DESC)

            const entities = makeEntities(2)
            const builder = createMockQueryBuilder(entities)

            const result = await paginator.paginate(builder)
            const rawCursor = result.cursor.afterCursor!
            const decoded = atob(rawCursor)
            const parts = decoded.split(',')

            expect(parts).toHaveLength(2)
            expect(parts[0]).toMatch(/^created:/)
            expect(parts[1]).toMatch(/^id:/)

            // The id should be the last entity in the page (index 0 since limit=1)
            const idValue = decodeURIComponent(parts[1].split(':')[1])
            expect(idValue).toBe('id_001')
        })
    })

    describe('buildOrder with id tiebreaker', () => {
        it('should add id as secondary sort key in DESC order', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)
            paginator.setOrder(Order.DESC)

            const entities = makeEntities(1)
            const builder = createMockQueryBuilder(entities)

            await paginator.paginate(builder)

            const addOrderByCalls = (builder.addOrderBy as ReturnType<typeof vi.fn>).mock.calls
            expect(addOrderByCalls.length).toBe(2)
            expect(addOrderByCalls[0]).toEqual(['test_entity.created', Order.DESC])
            expect(addOrderByCalls[1]).toEqual(['test_entity.id', Order.DESC])
        })

        it('should add id as secondary sort key in ASC order', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)
            paginator.setOrder(Order.ASC)

            const entities = makeEntities(1)
            const builder = createMockQueryBuilder(entities)

            await paginator.paginate(builder)

            const addOrderByCalls = (builder.addOrderBy as ReturnType<typeof vi.fn>).mock.calls
            expect(addOrderByCalls.length).toBe(2)
            expect(addOrderByCalls[0]).toEqual(['test_entity.created', Order.ASC])
            expect(addOrderByCalls[1]).toEqual(['test_entity.id', Order.ASC])
        })
    })

    describe('pagination with duplicate timestamps', () => {
        it('should correctly paginate when all records have the same timestamp', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const sameTimestamp = '2025-09-22T10:18:10.000Z'

            // Page 1: limit 2, returns 3 items (hasMore=true)
            const paginator1 = new Paginator(entity)
            paginator1.setLimit(2)
            paginator1.setOrder(Order.DESC)

            const page1Entities = makeEntities(3, sameTimestamp)
            const builder1 = createMockQueryBuilder(page1Entities)

            const page1 = await paginator1.paginate(builder1)
            expect(page1.data).toHaveLength(2)
            expect(page1.cursor.afterCursor).not.toBeNull()

            // Verify cursor contains both timestamp AND id
            const decodedCursor = atob(page1.cursor.afterCursor!)
            expect(decodedCursor).toContain('id:')
        })

        it('should apply cursor query with id tiebreaker when cursor contains id', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(2)
            paginator.setOrder(Order.DESC)

            // Simulate having an afterCursor with both created and id
            const createdEncoded = encodeByType('timestamp with time zone', TIMESTAMP)
            const idEncoded = encodeByType('string', 'id_002')
            const cursor = btoa(`created:${createdEncoded},id:${idEncoded}`)
            paginator.setAfterCursor(cursor)

            const entities = makeEntities(2) 
            const builder = createMockQueryBuilder(entities)

            await paginator.paginate(builder)

            // andWhere should be called (for the cursor brackets)
            const andWhereCalls = (builder.andWhere as ReturnType<typeof vi.fn>).mock.calls
            expect(andWhereCalls.length).toBeGreaterThan(0)
        })
    })

    describe('backward compatibility', () => {
        it('should handle old cursors without id field gracefully', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)
            paginator.setOrder(Order.DESC)

            // Old-format cursor: only created, no id
            const createdEncoded = encodeByType('timestamp with time zone', TIMESTAMP)
            const oldCursor = btoa(`created:${createdEncoded}`)
            paginator.setAfterCursor(oldCursor)

            const entities = makeEntities(2)
            const builder = createMockQueryBuilder(entities)

            // Should not throw - gracefully falls back to timestamp-only comparison
            const result = await paginator.paginate(builder)
            expect(result.data).toHaveLength(2)
        })
    })

    describe('getEntityPropertyType with constructor types', () => {
        it('should resolve String constructor to "string"', async () => {
            const entity = createMockEntity({
                id: { type: String },
                created: { type: 'timestamp with time zone' },
            })
            const paginator = new Paginator(entity)
            paginator.setLimit(10)

            // This exercises getEntityPropertyType for the id column (type: String)
            // via the encode path when there are > limit results
            const entities = makeEntities(11)
            const builder = createMockQueryBuilder(entities)

            // Should not throw "function String() { [native code] }" type error
            const result = await paginator.paginate(entities.length > 10 ? builder : builder)
            expect(result.cursor.afterCursor).not.toBeNull()
        })

        it('should resolve Number constructor to "number"', () => {
            const entity = createMockEntity({
                id: { type: String },
                created: { type: 'timestamp with time zone' },
                count: { type: Number },
            })
            // Accessing private method through any cast to test type resolution
            const paginator = new Paginator(entity) as any
            expect(paginator.getEntityPropertyType('count')).toBe('number')
        })

        it('should resolve Date constructor to "date"', () => {
            const entity = createMockEntity({
                id: { type: String },
                created: { type: 'timestamp with time zone' },
                birthday: { type: Date },
            })
            const paginator = new Paginator(entity) as any
            expect(paginator.getEntityPropertyType('birthday')).toBe('date')
        })

        it('should resolve string type names as-is', () => {
            const entity = createMockEntity({
                id: { type: String },
                created: { type: 'timestamp with time zone' },
            })
            const paginator = new Paginator(entity) as any
            expect(paginator.getEntityPropertyType('created')).toBe('timestamp with time zone')
        })

        it('should throw for unknown entity property', () => {
            const entity = createMockEntity({
                id: { type: String },
                created: { type: 'timestamp with time zone' },
            })
            const paginator = new Paginator(entity) as any
            expect(() => paginator.getEntityPropertyType('nonexistent')).toThrow('entity property not found')
        })
    })

    describe('composite order (not affected by changes)', () => {
        it('should not add id tiebreaker when compositeOrderBy is set', async () => {
            const entity = createMockEntity({
                ...DEFAULT_COLUMNS,
                name: { type: String },
            })
            const paginator = new Paginator(entity)
            paginator.setLimit(10)
            paginator.setCompositeOrderBy([
                { field: 'created', order: Order.DESC },
                { field: 'name', order: Order.ASC },
            ])

            const entities = [
                { id: '1', created: TIMESTAMP, name: 'alpha' },
            ]
            const builder = createMockQueryBuilder(entities)

            await paginator.paginate(builder)

            const addOrderByCalls = (builder.addOrderBy as ReturnType<typeof vi.fn>).mock.calls
            // Should only have the composite order keys, not the id tiebreaker
            expect(addOrderByCalls.length).toBe(2)
            expect(addOrderByCalls[0]).toEqual(['test_entity.created', Order.DESC])
            expect(addOrderByCalls[1]).toEqual(['test_entity.name', Order.ASC])
        })
    })

    describe('unlimited pagination', () => {
        it('should skip cursor and limit when unlimited', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(Paginator.NO_LIMIT)

            const entities = makeEntities(5)
            const builder = createMockQueryBuilder(entities)

            const result = await paginator.paginate(builder)

            expect(result.data).toHaveLength(5)
            expect(result.cursor.afterCursor).toBeNull()
            expect(result.cursor.beforeCursor).toBeNull()

            // take should not be called when unlimited
            expect(builder.take).not.toHaveBeenCalled()
        })
    })

    describe('basic pagination behavior', () => {
        it('should return empty result with no cursors when data is empty', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)

            const builder = createMockQueryBuilder([])

            const result = await paginator.paginate(builder)

            expect(result.data).toHaveLength(0)
            expect(result.cursor.afterCursor).toBeNull()
            expect(result.cursor.beforeCursor).toBeNull()
        })

        it('should not set afterCursor when data fits within limit', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)

            const entities = makeEntities(5)
            const builder = createMockQueryBuilder(entities)

            const result = await paginator.paginate(builder)

            expect(result.data).toHaveLength(5)
            expect(result.cursor.afterCursor).toBeNull()
        })

        it('should set afterCursor when there are more results than the limit', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(2)

            // 3 entities returned = limit + 1, meaning hasMore=true
            const entities = makeEntities(3)
            const builder = createMockQueryBuilder(entities)

            const result = await paginator.paginate(builder)

            expect(result.data).toHaveLength(2)
            expect(result.cursor.afterCursor).not.toBeNull()
        })

        it('should set take to limit + 1', async () => {
            const entity = createMockEntity(DEFAULT_COLUMNS)
            const paginator = new Paginator(entity)
            paginator.setLimit(10)

            const entities = makeEntities(1)
            const builder = createMockQueryBuilder(entities)

            await paginator.paginate(builder)

            expect(builder.take).toHaveBeenCalledWith(11)
        })
    })
})
