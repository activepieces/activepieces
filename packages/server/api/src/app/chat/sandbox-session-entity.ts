import { EntitySchema } from 'typeorm'

type SandboxSessionRecord = {
    id: string
    agent: string
    agentSessionId: string
    lastConnectionId: string
    createdAt: number
    destroyedAt: number | null
    sandboxId: string | null
    sessionInit: unknown
    configOptions: unknown[]
    modes: unknown
}

export const SandboxSessionEntity = new EntitySchema<SandboxSessionRecord>({
    name: 'sandbox_session',
    columns: {
        id: {
            type: String,
            primary: true,
        },
        agent: {
            type: String,
            nullable: false,
        },
        agentSessionId: {
            type: String,
            nullable: false,
        },
        lastConnectionId: {
            type: String,
            nullable: false,
        },
        createdAt: {
            type: 'bigint',
            nullable: false,
        },
        destroyedAt: {
            type: 'bigint',
            nullable: true,
        },
        sandboxId: {
            type: String,
            nullable: true,
        },
        sessionInit: {
            type: 'jsonb',
            nullable: true,
        },
        configOptions: {
            type: 'jsonb',
            nullable: true,
        },
        modes: {
            type: 'jsonb',
            nullable: true,
        },
    },
})

export type { SandboxSessionRecord }
