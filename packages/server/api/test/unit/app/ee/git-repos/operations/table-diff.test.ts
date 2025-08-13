import { nanoid } from 'nanoid'
import { projectDiffService } from '../../../../../../src/app/ee/projects/project-release/project-state/project-diff.service'
import { tableGenerator } from '../../../../../helpers/table-generator'

describe('Table Diff Service', () => {

    it('should return the table to delete', async () => {
        const tableTwo = tableGenerator.simpleTable()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableTwo],
            },
            newState: {
                flows: [],
                tables: [],
            },
        })
        expect(diff.tables.length).toBe(1)
        expect(diff.tables[0].type).toBe('DELETE_TABLE')
        expect(diff.tables[0].tableState.externalId).toBe(tableTwo.externalId)
    })

    it('should return the table to create', async () => {
        const tableTwo = tableGenerator.simpleTable()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [],
            },
            newState: {
                flows: [],
                tables: [tableTwo],
            },
        })
        expect(diff.tables.length).toBe(1)
        expect(diff.tables[0].type).toBe('CREATE_TABLE')
        expect(diff.tables[0].tableState).toBe(tableTwo)
    })

    it('should return the table to create if the mapping is invalid', async () => {
        const tableOne = tableGenerator.simpleTable(nanoid())
        const tableTwo = tableGenerator.simpleTable()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableTwo],
            },
            newState: {
                flows: [],
                tables: [tableOne],
            },
        })
        const sortedTables = [...diff.tables].sort((a, b) => a.type.localeCompare(b.type))
        expect(sortedTables).toEqual([
            {
                type: 'CREATE_TABLE',
                tableState: tableOne,
            },
            {
                type: 'DELETE_TABLE',
                tableState: {
                    externalId: tableTwo.externalId,
                },
            },
        ])
    })

    it('should return the table to update', async () => {
        const tableTwo = tableGenerator.simpleTable()
        const tableOne = tableGenerator.simpleTable(tableTwo.externalId)
        tableOne.name = 'Updated Table Name'

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableTwo],
            },
        })
        expect(diff.tables.length).toBe(1)
        expect(diff.tables[0]).toEqual({
            type: 'UPDATE_TABLE',
            tableState: tableOne,
            newTableState: tableTwo,
        })
    })

    it('should skip the table to update if the table is not changed', async () => {
        const tableOne = tableGenerator.simpleTable()
        const tableOneDist = tableGenerator.simpleTable(tableOne.externalId)
        tableOneDist.name = tableOne.name

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableOneDist],
            },
        })
        expect(diff.tables).toEqual([
            {
                type: 'UPDATE_TABLE',
                tableState: tableOne,
                newTableState: tableOneDist,
            },
        ])
    })

    it('should return the table to create, update and delete', async () => {
        const tableOne = tableGenerator.simpleTable()
        const tableTwo = tableGenerator.simpleTable()
        const tableThree = tableGenerator.simpleTable()
        const tableOneDist = tableGenerator.simpleTable(tableOne.externalId)
        tableOneDist.name = 'Updated Table One'

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne, tableThree],
            },
            newState: {
                flows: [],
                tables: [tableOneDist, tableTwo],
            },
        })
        expect(diff.tables.length).toBe(3)
        expect(diff.tables).toEqual(
            expect.arrayContaining([
                {
                    type: 'DELETE_TABLE',
                    tableState: expect.objectContaining({
                        externalId: tableThree.externalId,
                    }),
                },
                {
                    type: 'CREATE_TABLE',
                    tableState: expect.objectContaining({
                        externalId: tableTwo.externalId,
                        name: tableTwo.name,
                        fields: tableTwo.fields,
                        id: tableTwo.id,
                    }),
                },
                {
                    type: 'UPDATE_TABLE',
                    tableState: expect.objectContaining({
                        externalId: tableOne.externalId,
                        name: tableOne.name,
                        fields: tableOne.fields,
                        id: tableOne.id,
                    }),
                    newTableState: expect.objectContaining({
                        externalId: tableOneDist.externalId,
                        name: tableOneDist.name,
                        fields: tableOneDist.fields,
                        id: tableOneDist.id,
                    }),
                },
            ]),
        )
    })

    it('should detect field changes in table update', async () => {
        const tableOne = tableGenerator.simpleTable()
        const tableOneDist = tableGenerator.simpleTable(tableOne.externalId)
        tableOneDist.fields.push({
            name: 'New Field',
            type: 'TEXT',
            externalId: nanoid(),
        })

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableOneDist],
            },
        })
        expect(diff.tables.length).toBe(1)
        expect(diff.tables[0].type).toBe('UPDATE_TABLE')
        expect(diff.tables[0].tableState).toBe(tableOne)
    })

    it('should detect dropdown field changes', async () => {
        const tableOne = tableGenerator.tableWithDropdown()
        const tableOneDist = tableGenerator.tableWithDropdown(tableOne.externalId)
        tableOneDist.fields[1].data!.options.push({ value: 'Pending' })

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableOneDist],
            },
        })
        expect(diff.tables.length).toBe(1)
        expect(diff.tables[0].type).toBe('UPDATE_TABLE')
    })
}) 