import { nanoid } from 'nanoid'
import { projectDiffService } from '../../../../../../../../src/app/ee/projects/project-release/project-state/project-diff.service'
import { projectStateService } from '../../../../../../../../src/app/ee/projects/project-release/project-state/project-state.service'
import { system } from '../../../../../../../../src/app/helper/system/system'
import { tableGenerator } from '../../../../../../../helpers/table-generator'

describe('Table Diff Service', () => {

    it('should return the table to delete', async () => {
        const tableTwo = tableGenerator.simpleTable({})
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
        const tableTwo = tableGenerator.simpleTable({})
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
        const tableOne = tableGenerator.simpleTable({ externalId: nanoid() })
        const tableTwo = tableGenerator.simpleTable({})
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
                tableState: tableTwo,
            },
        ])
    })

    it('should return the table to update', async () => {
        const tableTwo = tableGenerator.simpleTable({})
        const tableOne = tableGenerator.simpleTable({ externalId: tableTwo.externalId })
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
        const tableOne = tableGenerator.simpleTable({})
        const tableOneDist = tableGenerator.simpleTable({ externalId: tableOne.externalId })
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
        const tableOne = tableGenerator.simpleTable({})
        const tableTwo = tableGenerator.simpleTable({})
        const tableThree = tableGenerator.simpleTable({})
        const tableOneDist = tableGenerator.simpleTable({ externalId: tableOne.externalId })
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
        const tableOne = tableGenerator.simpleTable({})
        const tableOneDist = tableGenerator.simpleTable({ externalId: tableOne.externalId })
        tableOneDist.fields.push(tableGenerator.generateRandomField(tableOneDist.id))

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
        const dropdownField = tableGenerator.generateRandomDropdownField()
        const tableOne = projectStateService(system.globalLogger()).getTableState(tableGenerator.simpleTable({}))
        tableOne.fields.push(dropdownField)
        const tableOneDist = {
            ...tableOne,
            fields: [
                ...tableOne.fields,
                {
                    ...dropdownField,
                    data: {
                        ...dropdownField.data,
                        options: [
                            ...dropdownField.data!.options,
                            { value: 'Pending' },
                        ],
                    },
                },
            ],
        }


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

    it('should not detect table as changed when only id field differs', async () => {
        const tableOne = tableGenerator.simpleTable({})
        const tableTwo = tableGenerator.simpleTable({ externalId: tableOne.externalId })

        // Ensure all fields are identical
        tableTwo.name = tableOne.name
        tableTwo.fields = tableOne.fields

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

        expect(diff.tables.length).toBe(0)
    })

    it('should not detect table as changed when properties are in different order', async () => {
        const tableOne = tableGenerator.simpleTable({})
        
        // Create table with same content but different property ordering
        // This tests that deepEqual correctly handles property order independence
        const tableTwo = {
            fields: tableOne.fields, // fields first
            externalId: tableOne.externalId, // externalId second  
            name: tableOne.name, // name third
            id: tableOne.id, // id last
        }

        // Also test with fields in different order but same content
        const tableThree = {
            ...tableOne,
            fields: [
                {
                    externalId: tableOne.fields[0].externalId, // externalId first
                    type: tableOne.fields[0].type, // type second
                    name: tableOne.fields[0].name, // name last
                },
                {
                    type: tableOne.fields[1].type, // type first
                    name: tableOne.fields[1].name, // name second
                    externalId: tableOne.fields[1].externalId, // externalId last
                },
            ],
        }

        // Test tableOne vs tableTwo (different top-level property order)
        const diff1 = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableTwo],
            },
        })

        // Test tableOne vs tableThree (different field property order)
        const diff2 = await projectDiffService.diff({
            currentState: {
                flows: [],
                tables: [tableOne],
            },
            newState: {
                flows: [],
                tables: [tableThree],
            },
        })

        // Both should detect no changes despite different property ordering
        // This validates that deepEqual is working correctly for property order independence
        expect(diff1.tables.length).toBe(0)
        expect(diff2.tables.length).toBe(0)
    })
}) 