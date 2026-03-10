import { FieldType, FilterOperator } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../tables/field/field.service'
import { recordService } from '../../tables/record/record.service'
import { tableService } from '../../tables/table/table.service'

export async function registerTableTools(
    server: McpServer,
    projectId: string,
    log: FastifyBaseLogger,
): Promise<void> {
    registerTableCrudTools(server, projectId, log)
    registerFieldTools(server, projectId, log)
    registerRecordTools(server, projectId, log)
}

function registerTableCrudTools(server: McpServer, projectId: string, log: FastifyBaseLogger): void {
    server.tool(
        'list_tables',
        'List all tables in the project. Optionally filter by name.',
        { name: z.string().optional().describe('Filter tables by name') },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService.list({
                    projectId,
                    name: args.name,
                    cursor: undefined,
                    limit: 100,
                    externalIds: undefined,
                    folderId: undefined,
                }),
            )
        },
    )

    server.tool(
        'get_table',
        'Get a table by its ID.',
        { tableId: z.string().describe('The ID of the table to retrieve') },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService.getOneOrThrow({ projectId, id: args.tableId }),
            )
        },
    )

    server.tool(
        'create_table',
        'Create a new table with the given name.',
        { name: z.string().describe('The name of the table to create') },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService.create({ projectId, request: { projectId, name: args.name } }),
            )
        },
    )

    server.tool(
        'delete_table',
        'Delete a table by its ID. This will permanently remove the table and all its data.',
        { tableId: z.string().describe('The ID of the table to delete') },
        async (args) => {
            return wrapServiceCall(log, async () => {
                await tableService.delete({ projectId, id: args.tableId })
                return { success: true }
            })
        },
    )
}

function registerFieldTools(server: McpServer, projectId: string, log: FastifyBaseLogger): void {
    server.tool(
        'list_fields',
        'List all fields (columns) of a table. Use this to get field IDs before creating or updating records.',
        { tableId: z.string().describe('The ID of the table') },
        async (args) => {
            return wrapServiceCall(log, () =>
                fieldService.getAll({ projectId, tableId: args.tableId }),
            )
        },
    )

    server.tool(
        'create_field',
        'Create a new field (column) in a table. Supported types: TEXT, NUMBER, DATE, STATIC_DROPDOWN. For STATIC_DROPDOWN, provide data with options.',
        {
            tableId: z.string().describe('The ID of the table'),
            name: z.string().describe('The name of the field'),
            type: z.nativeEnum(FieldType).describe('The type of the field: TEXT, NUMBER, DATE, or STATIC_DROPDOWN'),
            data: z.object({
                options: z.array(z.object({ value: z.string() })),
            }).optional().describe('Required for STATIC_DROPDOWN type. Provide an array of options.'),
        },
        async (args) => {
            return wrapServiceCall(log, () => {
                if (args.type === FieldType.STATIC_DROPDOWN) {
                    return fieldService.create({
                        projectId,
                        request: {
                            tableId: args.tableId,
                            name: args.name,
                            type: FieldType.STATIC_DROPDOWN,
                            data: args.data ?? { options: [] },
                        },
                    })
                }
                return fieldService.create({
                    projectId,
                    request: {
                        tableId: args.tableId,
                        name: args.name,
                        type: args.type as FieldType.TEXT | FieldType.NUMBER | FieldType.DATE,
                    },
                })
            })
        },
    )

    server.tool(
        'update_field',
        'Rename a field (column).',
        {
            fieldId: z.string().describe('The ID of the field to update'),
            name: z.string().describe('The new name for the field'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                fieldService.update({ id: args.fieldId, projectId, request: { name: args.name } }),
            )
        },
    )

    server.tool(
        'delete_field',
        'Delete a field (column) from a table.',
        { fieldId: z.string().describe('The ID of the field to delete') },
        async (args) => {
            return wrapServiceCall(log, async () => {
                await fieldService.delete({ id: args.fieldId, projectId })
                return { success: true }
            })
        },
    )
}

function registerRecordTools(server: McpServer, projectId: string, log: FastifyBaseLogger): void {
    server.tool(
        'list_records',
        'List records (rows) in a table. Use list_fields first to get field IDs for filtering.',
        {
            tableId: z.string().describe('The ID of the table'),
            limit: z.number().optional().describe('Maximum number of records to return (default 100)'),
            filters: z.array(z.object({
                fieldId: z.string().describe('The field ID to filter on'),
                value: z.string().describe('The value to filter by'),
                operator: z.nativeEnum(FilterOperator).optional().describe('Filter operator: eq, neq, gt, gte, lt, lte, co (contains). Defaults to eq.'),
            })).optional().describe('Optional filters to apply'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService.list({
                    tableId: args.tableId,
                    projectId,
                    filters: args.filters ?? null,
                    limit: args.limit ?? 100,
                }),
            )
        },
    )

    server.tool(
        'create_records',
        'Create one or more records (rows) in a table. Use list_fields first to get field IDs. Each record is an array of cell objects with fieldId and value.',
        {
            tableId: z.string().describe('The ID of the table'),
            records: z.array(z.array(z.object({
                fieldId: z.string().describe('The field ID'),
                value: z.string().describe('The cell value as a string'),
            }))).describe('Array of records. Each record is an array of {fieldId, value} cells.'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService.create({
                    projectId,
                    request: { tableId: args.tableId, records: args.records },
                }),
            )
        },
    )

    server.tool(
        'get_record',
        'Get a single record by its ID.',
        { recordId: z.string().describe('The ID of the record to retrieve') },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService.getById({ id: args.recordId, projectId }),
            )
        },
    )

    server.tool(
        'update_record',
        'Update a record. Provide the cells to update with their field IDs and new values.',
        {
            recordId: z.string().describe('The ID of the record to update'),
            tableId: z.string().describe('The ID of the table containing the record'),
            cells: z.array(z.object({
                fieldId: z.string().describe('The field ID'),
                value: z.string().describe('The new cell value as a string'),
            })).describe('Array of {fieldId, value} cells to update'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService.update({
                    id: args.recordId,
                    projectId,
                    request: { tableId: args.tableId, cells: args.cells },
                }),
            )
        },
    )

    server.tool(
        'delete_records',
        'Delete one or more records by their IDs.',
        {
            recordIds: z.array(z.string()).describe('Array of record IDs to delete'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService.delete({ ids: args.recordIds, projectId }),
            )
        },
    )
}

async function wrapServiceCall(log: FastifyBaseLogger, fn: () => Promise<unknown>): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
    try {
        const result = await fn()
        return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
        }
    }
    catch (error) {
        log.error({ error }, 'MCP table tool error')
        const message = error instanceof Error ? error.message : 'Unknown error occurred'
        return {
            content: [{ type: 'text', text: message }],
            isError: true,
        }
    }
}
