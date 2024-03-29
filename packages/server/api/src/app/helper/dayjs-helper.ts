import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'

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
