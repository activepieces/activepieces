export const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday'];
export const MONTHS = [...Array(31).keys()];
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