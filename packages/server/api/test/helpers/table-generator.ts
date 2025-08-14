import { apId, FieldType, TableState } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

export const tableGenerator = {
    simpleTable(externalId?: string): TableState {
        return {
            id: apId(),
            name: faker.lorem.word(),
            externalId: externalId ?? apId(),
            fields: [
                {
                    name: 'Name',
                    type: FieldType.TEXT,
                    externalId: apId(),
                },
                {
                    name: 'Age',
                    type: FieldType.NUMBER,
                    externalId: apId(),
                },
            ],
        }
    },

    tableWithDropdown(externalId?: string): TableState {
        return {
            id: apId(),
            name: faker.lorem.word(),
            externalId: externalId ?? apId(),
            fields: [
                {
                    name: 'Name',
                    type: FieldType.TEXT,
                    externalId: apId(),
                },
                {
                    name: 'Status',
                    type: FieldType.STATIC_DROPDOWN,
                    externalId: apId(),
                    data: {
                        options: [
                            { value: 'Active' },
                            { value: 'Inactive' },
                        ],
                    },
                },
            ],
        }
    },

    tableWithDateField(externalId?: string): TableState {
        return {
            id: apId(),
            name: faker.lorem.word(),
            externalId: externalId ?? apId(),
            fields: [
                {
                    name: 'Name',
                    type: FieldType.TEXT,
                    externalId: apId(),
                },
                {
                    name: 'Created Date',
                    type: FieldType.DATE,
                    externalId: apId(),
                },
            ],
        }
    },
} 