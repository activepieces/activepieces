import { ScheduleOptions, TriggerSourceScheduleType } from '../../src'

describe('ScheduleOptions', () => {
    it('parses legacy cron rows', () => {
        const legacyRow = {
            type: TriggerSourceScheduleType.CRON_EXPRESSION,
            cronExpression: '*/5 * * * *',
            timezone: 'UTC',
        }
        expect(ScheduleOptions.parse(legacyRow)).toEqual(legacyRow)
    })

    it('parses interval schedules', () => {
        const interval = {
            type: TriggerSourceScheduleType.INTERVAL,
            intervalMs: 59 * 60_000,
        }
        expect(ScheduleOptions.parse(interval)).toEqual(interval)
    })

    it('rejects sub-minute intervals', () => {
        expect(ScheduleOptions.safeParse({
            type: TriggerSourceScheduleType.INTERVAL,
            intervalMs: 59_999,
        }).success).toBe(false)
    })

    it('rejects non-integer intervals', () => {
        expect(ScheduleOptions.safeParse({
            type: TriggerSourceScheduleType.INTERVAL,
            intervalMs: 60_000.5,
        }).success).toBe(false)
    })
})
