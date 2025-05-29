import { Agent, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'


type AgentSchema = Agent & {
    project: Project    
    platform: Platform
}
export const AgentEntity = new EntitySchema<AgentSchema>({
    name: 'agent',
    columns: {
        ...BaseColumnSchemaPart,
        profilePictureUrl: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: false,
        },
        maxSteps: {
            type: Number,
            nullable: false,
        },
        systemPrompt: {
            type: String,
            nullable: false,
        },
        projectId: {
            type: String,
            nullable: false,
        },
        platformId: {
            type: String,
            nullable: false,
        },
    },
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            inverseSide: 'agents',
        },
        platform: {
            type: 'many-to-one',
            target: 'platform',
            inverseSide: 'agents',
        },
    },
})