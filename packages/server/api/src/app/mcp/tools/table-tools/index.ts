import { FieldType, Filter, FilterOperator } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { fieldService } from '../../../tables/field/field.service'
import { recordService } from '../../../tables/record/record.service'
import { tableService } from '../../../tables/table/table.service'

export async function registerTableTools(
    server: McpServer,
    log: FastifyBaseLogger,
): Promise<void> {
    registerTableCrudTools(server, log)
    registerFieldTools(server, log)
    registerRecordTools(server, log)
}

function registerTableCrudTools(server: McpServer, log: FastifyBaseLogger): void {
    server.tool(
        'list_tables',
        'List all tables. Optionally filter by name.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            name: z.string().optional().describe('Filter tables by name'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService(log).list({
                    projectId: args.projectId,
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
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            tableId: z.string().describe('The ID of the table to retrieve'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService(log).getOneOrThrow({ projectId: args.projectId, id: args.tableId }),
            )
        },
    )

    server.tool(
        'create_table',
        'Create a new table with the given name.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            name: z.string().describe('The name of the table to create'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                tableService(log).create({ projectId: args.projectId, request: { projectId: args.projectId, name: args.name } }),
            )
        },
    )

    server.tool(
        'delete_table',
        'Delete a table by its ID. This will permanently remove the table and all its data.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            tableId: z.string().describe('The ID of the table to delete'),
        },
        async (args) => {
            return wrapServiceCall(log, async () => {
                await tableService(log).delete({ projectId: args.projectId, id: args.tableId })
                return { success: true }
            })
        },
    )
}

function registerFieldTools(server: McpServer, log: FastifyBaseLogger): void {
    server.tool(
        'list_fields',
        'List all fields (columns) of a table. Use this to get field IDs before creating or updating records.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            tableId: z.string().describe('The ID of the table'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                fieldService(log).getAll({ projectId: args.projectId, tableId: args.tableId }),
            )
        },
    )

    server.tool(
        'create_field',
        'Create a new field (column) in a table. Supported types: TEXT, NUMBER, DATE, STATIC_DROPDOWN. For STATIC_DROPDOWN, provide data with options.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
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
                    return fieldService(log).create({
                        projectId: args.projectId,
                        request: {
                            tableId: args.tableId,
                            name: args.name,
                            type: FieldType.STATIC_DROPDOWN,
                            data: args.data ?? { options: [] },
                        },
                    })
                }
                return fieldService(log).create({
                    projectId: args.projectId,
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
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            fieldId: z.string().describe('The ID of the field to update'),
            name: z.string().describe('The new name for the field'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                fieldService(log).update({ id: args.fieldId, projectId: args.projectId, request: { name: args.name } }),
            )
        },
    )

    server.tool(
        'delete_field',
        'Delete a field (column) from a table.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            fieldId: z.string().describe('The ID of the field to delete'),
        },
        async (args) => {
            return wrapServiceCall(log, async () => {
                await fieldService(log).delete({ id: args.fieldId, projectId: args.projectId })
                return { success: true }
            })
        },
    )
}

function registerRecordTools(server: McpServer, log: FastifyBaseLogger): void {
    server.tool(
        'list_records',
        'List records (rows) in a table. Use list_fields first to get field IDs for filtering.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
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
                recordService(log).list({
                    tableId: args.tableId,
                    projectId: args.projectId,
                    filters: (args.filters as Filter[]) ?? null,
                    limit: args.limit ?? 100,
                    cursorRequest: null,
                }),
            )
        },
    )

    server.tool(
        'create_records',
        'Create one or more records (rows) in a table. Use list_fields first to get field IDs. Each record is an array of cell objects with fieldId and value.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            tableId: z.string().describe('The ID of the table'),
            records: z.array(z.array(z.object({
                fieldId: z.string().describe('The field ID'),
                value: z.string().describe('The cell value as a string'),
            }))).describe('Array of records. Each record is an array of {fieldId, value} cells.'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService(log).create({
                    projectId: args.projectId,
                    request: { tableId: args.tableId, records: args.records },
                }),
            )
        },
    )

    server.tool(
        'get_record',
        'Get a single record by its ID.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            recordId: z.string().describe('The ID of the record to retrieve'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService(log).getById({ id: args.recordId, projectId: args.projectId }),
            )
        },
    )

    server.tool(
        'update_records',
        'Update one or more records. Each record specifies its ID and the cells to update.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            tableId: z.string().describe('The ID of the table containing the records'),
            records: z.array(z.object({
                recordId: z.string().describe('The ID of the record to update'),
                cells: z.array(z.object({
                    fieldId: z.string().describe('The field ID'),
                    value: z.string().describe('The new cell value as a string'),
                })).describe('Array of {fieldId, value} cells to update'),
            })).describe('Array of records to update'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService(log).updateMany({
                    projectId: args.projectId,
                    request: { tableId: args.tableId, records: args.records },
                }),
            )
        },
    )

    server.tool(
        'delete_records',
        'Delete one or more records by their IDs.',
        {
            projectId: z.string().describe('The project ID. Use list_projects to find available projects.'),
            recordIds: z.array(z.string()).describe('Array of record IDs to delete'),
        },
        async (args) => {
            return wrapServiceCall(log, () =>
                recordService(log).delete({ ids: args.recordIds, projectId: args.projectId }),
            )
        },
    )
}

async function wrapServiceCall(log: FastifyBaseLogger, fn: () => Promise<unknown>): Promise<{ content: { type: 'text', text: string }[], isError?: boolean }> {
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
