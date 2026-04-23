import { EntitySchema } from 'typeorm'

type SandboxSessionEventRecord = {
    id: string
    eventIndex: number
    sessionId: string
    createdAt: number
    connectionId: string
    sender: string
    payload: unknown
}

export const SandboxSessionEventEntity = new EntitySchema<SandboxSessionEventRecord>({
    name: 'sandbox_session_event',
    columns: {
        id: {
            type: String,
            primary: true,
        },
        eventIndex: {
            type: Number,
            nullable: false,
        },
        sessionId: {
            type: String,
            nullable: false,
        },
        createdAt: {
            type: 'bigint',
            nullable: false,
        },
        connectionId: {
            type: String,
            nullable: false,
        },
        sender: {
            type: String,
            nullable: false,
        },
        payload: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_sandbox_session_event_session_id',
            columns: ['sessionId'],
        },
        {
            name: 'idx_sandbox_session_event_session_index',
            columns: ['sessionId', 'eventIndex'],
        },
    ],
})

export type { SandboxSessionEventRecord }
