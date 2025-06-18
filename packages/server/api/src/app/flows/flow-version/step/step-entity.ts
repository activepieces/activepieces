import { EntitySchema } from 'typeorm'
import { Step } from './step'

type StepSchema = Step & {
    id: string
    parentStep: Step | null
    previousStep: Step | null
}

export const StepEntity = new EntitySchema<StepSchema>({
    name: 'step',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
        },
        flowVersionId: {
            type: String,
            nullable: false,
        },
        flowId: {
            type: String,
            nullable: false,
        },
        name: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        },
    },
    indices: [

    ],
    relations: {
        parentStep: {
            type: 'many-to-one',
            target: 'step',
            joinColumn:
                { name: 'parentStepId', referencedColumnName: 'id' },

            orphanedRowAction: 'delete',
            nullable: true,
            onDelete: 'CASCADE',
        },
        previousStep: {
            type: 'one-to-one',
            target: 'step',
            joinColumn: {
                name: 'previousStepId',
                referencedColumnName: 'id',
            },
            orphanedRowAction: 'delete',
            nullable: true,
            onDelete: 'CASCADE',
        },
        children: {
            type: 'one-to-many',
            target: 'step',
            inverseSide: 'parentStep',
            cascade: true,
            onDelete: 'CASCADE',
        },
        nextStep: {
            type: 'one-to-one',
            target: 'step',
            inverseSide: 'previousStep',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
})
