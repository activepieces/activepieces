import { EntitySchema } from 'typeorm'

export type AppSumoPlan = {
    plan_id: string
    uuid: string
    activation_email: string
}

export const AppSumoEntity = new EntitySchema<AppSumoPlan>({
    name: 'appsumo',
    columns: {
        uuid: {
            type: String,
            primary: true,
        },
        plan_id: {
            type: String,
        },
        activation_email: {
            type: String,
        },
    },
    indices: [],
    relations: {},
})
