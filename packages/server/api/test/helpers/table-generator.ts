import { apId, Field, FieldState, FieldType, PopulatedTable, TableAutomationStatus } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

export const tableGenerator = {
    simpleTable(table: Partial<PopulatedTable>): PopulatedTable {
        const tableId = apId()
        return {
            id: tableId,
            name: faker.lorem.word(),
            externalId: table.externalId ?? apId(),
            fields: table.fields ?? [
                tableGenerator.generateRandomField(tableId),
                tableGenerator.generateRandomField(tableId),
            ],
            projectId: apId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            status: table.status ?? TableAutomationStatus.ENABLED,
            trigger: table.trigger ?? null,
        }
    },
    generateRandomField(tableId: string): Field {
        return {
            id: apId(),
            projectId: apId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            tableId,
            name: faker.lorem.word(),
            type: FieldType.TEXT,
            externalId: apId(),
        }
    },
    generateRandomDropdownField(): FieldState {
        return {
            name: faker.lorem.word(),
            type: FieldType.STATIC_DROPDOWN,
            externalId: apId(),
            data: {
                options: [
                    { value: faker.lorem.word() },
                    { value: faker.lorem.word() },
                ],
            },
        }
    },
} 