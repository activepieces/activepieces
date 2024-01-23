import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function apDayjs(time: undefined | number | string = undefined): dayjs.Dayjs {
    if (time === undefined) {
        return dayjs()
    }
    return dayjs(time)
}

