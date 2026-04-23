import { EntitySchema } from 'typeorm'

export const SandboxSessionEntity = new EntitySchema<SandboxSessionRow>({
    name: 'sandbox_sessions',
    columns: {
        id: { type: String, primary: true },
        agent: { type: String },
        agent_session_id: { type: String },
        last_connection_id: { type: String },
        created_at: { type: 'bigint' },
        destroyed_at: { type: 'bigint', nullable: true },
        sandbox_id: { type: String, nullable: true },
        session_init_json: { type: 'jsonb', nullable: true },
        config_options_json: { type: 'jsonb', nullable: true },
        modes_json: { type: 'jsonb', nullable: true },
    },
})

export const SandboxSessionEventEntity = new EntitySchema<SandboxSessionEventRow>({
    name: 'sandbox_events',
    columns: {
        id: { type: String, primary: true },
        event_index: { type: 'bigint' },
        session_id: { type: String },
        created_at: { type: 'bigint' },
        connection_id: { type: String },
        sender: { type: String },
        payload_json: { type: 'jsonb' },
    },
    indices: [
        {
            name: 'idx_sandbox_events_session_order',
            columns: ['session_id', 'event_index', 'id'],
        },
    ],
})

type SandboxSessionRow = {
    id: string
    agent: string
    agent_session_id: string
    last_connection_id: string
    created_at: number
    destroyed_at: number | null
    sandbox_id: string | null
    session_init_json: Record<string, unknown> | null
    config_options_json: Record<string, unknown>[] | null
    modes_json: Record<string, unknown> | null
}

type SandboxSessionEventRow = {
    id: string
    event_index: number
    session_id: string
    created_at: number
    connection_id: string
    sender: string
    payload_json: Record<string, unknown>
}

export type { SandboxSessionRow, SandboxSessionEventRow }
