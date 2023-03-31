export const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];
export const MONTH_DAYS = [...Array(31).keys()];
const ELEVEN_HOURS= [...Array(11).keys()];
export const DAY_HOURS = ['Midnight', ...ELEVEN_HOURS.map(h=> h+1 + ' am'), 'Noon',...ELEVEN_HOURS.map(h=> h+1 +' pm')];
export function validateHours(hours:number)
{
    if(!Number.isInteger(hours))
    {
        return 0;
    }
    const hourOfTheDay = Math.min(Math.max(hours,0),23); 
    return hourOfTheDay;
}
export function validateWeekDays(days:number)
{
    if(!Number.isInteger(days))
    {
        return 0;
    }
    const dayOfTheWeek = Math.min(Math.max(0,days),6);
    return dayOfTheWeek;
}
export function validateMonthDays(days:number)
{
    if(!Number.isInteger(days))
    {
        return 0;
    }
    const dayofTheMonth = Math.min(Math.max(0,days),31);
    return dayofTheMonth;
}