import pino, { Logger } from 'pino'

export function silentLogger(): Logger {
    return pino({ level: process.env['E2E_LOG_LEVEL'] ?? 'silent' })
}
