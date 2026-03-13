import dayjs from 'dayjs'
import duration, { DurationUnitType } from 'dayjs/plugin/duration'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)

export function apDayjs(
    time: undefined | number | string = undefined,
): dayjs.Dayjs {
    if (time === undefined) {
        return dayjs()
    }
    return dayjs(time)
}

export function apDayjsDuration(
    value: number,
    unit: DurationUnitType,
) {
    return dayjs.duration(value, unit)
}