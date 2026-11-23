export const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const MONTH_DAYS = [...Array(31).keys()];
const ELEVEN_HOURS = [...Array(11).keys()];
export const DAY_HOURS = [
  'Midnight',
  ...ELEVEN_HOURS.map((h) => h + 1 + ' am'),
  'Noon',
  ...ELEVEN_HOURS.map((h) => h + 1 + ' pm'),
];
export function validateHours(hours: number) {
  if (!Number.isInteger(hours)) {
    return 0;
  }
  const hourOfTheDay = Math.min(Math.max(hours, 0), 23);
  return hourOfTheDay;
}
export function validateWeekDays(days: number) {
  if (!Number.isInteger(days)) {
    return 0;
  }
  const dayOfTheWeek = Math.min(Math.max(0, days), 6);
  return dayOfTheWeek;
}
export function validateMonthDays(days: number) {
  if (!Number.isInteger(days)) {
    return 0;
  }
  const dayofTheMonth = Math.min(Math.max(0, days), 31);
  return dayofTheMonth;
}

function utcOffset({ timeZone, date }: { timeZone: string; date: Date }) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  return name === undefined || name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}

function offsetMinutes(offset: string) {
  const [hours, minutes] = offset.slice(1).split(':').map(Number);
  return (offset.startsWith('-') ? -1 : 1) * (hours * 60 + minutes);
}

function yearlyOffsets(timeZone: string) {
  const year = new Date().getUTCFullYear();
  const offsets = [...Array(12).keys()]
    .map((month) => utcOffset({ timeZone, date: new Date(Date.UTC(year, month, 15, 12)) }))
    .sort((a, b) => offsetMinutes(a) - offsetMinutes(b));
  return [...new Set(offsets)];
}

const TIMEZONES = [
  {
    label: 'Pacific, Midway',
    value: 'Pacific/Midway',
  },
  {
    label: 'Pacific, Niue',
    value: 'Pacific/Niue',
  },
  {
    label: 'Pacific, Pago Pago',
    value: 'Pacific/Pago_Pago',
  },
  {
    label: 'Pacific, Honolulu',
    value: 'Pacific/Honolulu',
  },
  {
    label: 'Pacific, Rarotonga',
    value: 'Pacific/Rarotonga',
  },
  {
    label: 'Pacific, Tahiti',
    value: 'Pacific/Tahiti',
  },
  {
    label: 'Pacific, Marquesas',
    value: 'Pacific/Marquesas',
  },
  {
    label: 'America, Adak',
    value: 'America/Adak',
  },
  {
    label: 'Pacific, Gambier',
    value: 'Pacific/Gambier',
  },
  {
    label: 'America, Anchorage',
    value: 'America/Anchorage',
  },
  {
    label: 'America, Juneau',
    value: 'America/Juneau',
  },
  {
    label: 'America, Metlakatla',
    value: 'America/Metlakatla',
  },
  {
    label: 'America, Nome',
    value: 'America/Nome',
  },
  {
    label: 'America, Sitka',
    value: 'America/Sitka',
  },
  {
    label: 'America, Yakutat',
    value: 'America/Yakutat',
  },
  {
    label: 'Pacific, Pitcairn',
    value: 'Pacific/Pitcairn',
  },
  {
    label: 'America, Creston',
    value: 'America/Creston',
  },
  {
    label: 'America, Dawson',
    value: 'America/Dawson',
  },
  {
    label: 'America, Dawson Creek',
    value: 'America/Dawson_Creek',
  },
  {
    label: 'America, Fort Nelson',
    value: 'America/Fort_Nelson',
  },
  {
    label: 'America, Hermosillo',
    value: 'America/Hermosillo',
  },
  {
    label: 'America, Los Angeles',
    value: 'America/Los_Angeles',
  },
  {
    label: 'America, Mazatlan',
    value: 'America/Mazatlan',
  },
  {
    label: 'America, Phoenix',
    value: 'America/Phoenix',
  },
  {
    label: 'America, Tijuana',
    value: 'America/Tijuana',
  },
  {
    label: 'America, Vancouver',
    value: 'America/Vancouver',
  },
  {
    label: 'America, Whitehorse',
    value: 'America/Whitehorse',
  },
  {
    label: 'America, Bahia Banderas',
    value: 'America/Bahia_Banderas',
  },
  {
    label: 'America, Belize',
    value: 'America/Belize',
  },
  {
    label: 'America, Boise',
    value: 'America/Boise',
  },
  {
    label: 'America, Cambridge Bay',
    value: 'America/Cambridge_Bay',
  },
  {
    label: 'America, Chihuahua',
    value: 'America/Chihuahua',
  },
  {
    label: 'America, Ciudad Juarez',
    value: 'America/Ciudad_Juarez',
  },
  {
    label: 'America, Costa Rica',
    value: 'America/Costa_Rica',
  },
  {
    label: 'America, Denver',
    value: 'America/Denver',
  },
  {
    label: 'America, Edmonton',
    value: 'America/Edmonton',
  },
  {
    label: 'America, El Salvador',
    value: 'America/El_Salvador',
  },
  {
    label: 'America, Guatemala',
    value: 'America/Guatemala',
  },
  {
    label: 'America, Inuvik',
    value: 'America/Inuvik',
  },
  {
    label: 'America, Managua',
    value: 'America/Managua',
  },
  {
    label: 'America, Merida',
    value: 'America/Merida',
  },
  {
    label: 'America, Mexico City',
    value: 'America/Mexico_City',
  },
  {
    label: 'America, Monterrey',
    value: 'America/Monterrey',
  },
  {
    label: 'America, Regina',
    value: 'America/Regina',
  },
  {
    label: 'America, Swift Current',
    value: 'America/Swift_Current',
  },
  {
    label: 'America, Tegucigalpa',
    value: 'America/Tegucigalpa',
  },
  {
    label: 'Pacific, Easter',
    value: 'Pacific/Easter',
  },
  {
    label: 'Pacific, Galapagos',
    value: 'Pacific/Galapagos',
  },
  {
    label: 'America, Atikokan',
    value: 'America/Atikokan',
  },
  {
    label: 'America, Bogota',
    value: 'America/Bogota',
  },
  {
    label: 'America, Cancun',
    value: 'America/Cancun',
  },
  {
    label: 'America, Cayman',
    value: 'America/Cayman',
  },
  {
    label: 'America, Chicago',
    value: 'America/Chicago',
  },
  {
    label: 'America, Eirunepe',
    value: 'America/Eirunepe',
  },
  {
    label: 'America, Guayaquil',
    value: 'America/Guayaquil',
  },
  {
    label: 'America, Indiana, Knox',
    value: 'America/Indiana/Knox',
  },
  {
    label: 'America, Indiana, Tell City',
    value: 'America/Indiana/Tell_City',
  },
  {
    label: 'America, Jamaica',
    value: 'America/Jamaica',
  },
  {
    label: 'America, Lima',
    value: 'America/Lima',
  },
  {
    label: 'America, Matamoros',
    value: 'America/Matamoros',
  },
  {
    label: 'America, Menominee',
    value: 'America/Menominee',
  },
  {
    label: 'America, North Dakota, Beulah',
    value: 'America/North_Dakota/Beulah',
  },
  {
    label: 'America, North Dakota, Center',
    value: 'America/North_Dakota/Center',
  },
  {
    label: 'America, North Dakota, New Salem',
    value: 'America/North_Dakota/New_Salem',
  },
  {
    label: 'America, Ojinaga',
    value: 'America/Ojinaga',
  },
  {
    label: 'America, Panama',
    value: 'America/Panama',
  },
  {
    label: 'America, Rankin Inlet',
    value: 'America/Rankin_Inlet',
  },
  {
    label: 'America, Resolute',
    value: 'America/Resolute',
  },
  {
    label: 'America, Rio Branco',
    value: 'America/Rio_Branco',
  },
  {
    label: 'America, Winnipeg',
    value: 'America/Winnipeg',
  },
  {
    label: 'America, Anguilla',
    value: 'America/Anguilla',
  },
  {
    label: 'America, Antigua',
    value: 'America/Antigua',
  },
  {
    label: 'America, Aruba',
    value: 'America/Aruba',
  },
  {
    label: 'America, Asuncion',
    value: 'America/Asuncion',
  },
  {
    label: 'America, Barbados',
    value: 'America/Barbados',
  },
  {
    label: 'America, Blanc-Sablon',
    value: 'America/Blanc-Sablon',
  },
  {
    label: 'America, Boa Vista',
    value: 'America/Boa_Vista',
  },
  {
    label: 'America, Campo Grande',
    value: 'America/Campo_Grande',
  },
  {
    label: 'America, Caracas',
    value: 'America/Caracas',
  },
  {
    label: 'America, Cuiaba',
    value: 'America/Cuiaba',
  },
  {
    label: 'America, Curacao',
    value: 'America/Curacao',
  },
  {
    label: 'America, Detroit',
    value: 'America/Detroit',
  },
  {
    label: 'America, Dominica',
    value: 'America/Dominica',
  },
  {
    label: 'America, Grand Turk',
    value: 'America/Grand_Turk',
  },
  {
    label: 'America, Grenada',
    value: 'America/Grenada',
  },
  {
    label: 'America, Guadeloupe',
    value: 'America/Guadeloupe',
  },
  {
    label: 'America, Guyana',
    value: 'America/Guyana',
  },
  {
    label: 'America, Havana',
    value: 'America/Havana',
  },
  {
    label: 'America, Indiana, Indianapolis',
    value: 'America/Indiana/Indianapolis',
  },
  {
    label: 'America, Indiana, Marengo',
    value: 'America/Indiana/Marengo',
  },
  {
    label: 'America, Indiana, Petersburg',
    value: 'America/Indiana/Petersburg',
  },
  {
    label: 'America, Indiana, Vevay',
    value: 'America/Indiana/Vevay',
  },
  {
    label: 'America, Indiana, Vincennes',
    value: 'America/Indiana/Vincennes',
  },
  {
    label: 'America, Indiana, Winamac',
    value: 'America/Indiana/Winamac',
  },
  {
    label: 'America, Iqaluit',
    value: 'America/Iqaluit',
  },
  {
    label: 'America, Kentucky, Louisville',
    value: 'America/Kentucky/Louisville',
  },
  {
    label: 'America, Kentucky, Monticello',
    value: 'America/Kentucky/Monticello',
  },
  {
    label: 'America, Kralendijk',
    value: 'America/Kralendijk',
  },
  {
    label: 'America, La Paz',
    value: 'America/La_Paz',
  },
  {
    label: 'America, Lower Princes',
    value: 'America/Lower_Princes',
  },
  {
    label: 'America, Manaus',
    value: 'America/Manaus',
  },
  {
    label: 'America, Marigot',
    value: 'America/Marigot',
  },
  {
    label: 'America, Martinique',
    value: 'America/Martinique',
  },
  {
    label: 'America, Montserrat',
    value: 'America/Montserrat',
  },
  {
    label: 'America, Nassau',
    value: 'America/Nassau',
  },
  {
    label: 'America, New York',
    value: 'America/New_York',
  },
  {
    label: 'America, Port of Spain',
    value: 'America/Port_of_Spain',
  },
  {
    label: 'America, Port-au-Prince',
    value: 'America/Port-au-Prince',
  },
  {
    label: 'America, Porto Velho',
    value: 'America/Porto_Velho',
  },
  {
    label: 'America, Puerto Rico',
    value: 'America/Puerto_Rico',
  },
  {
    label: 'America, Santiago',
    value: 'America/Santiago',
  },
  {
    label: 'America, Santo Domingo',
    value: 'America/Santo_Domingo',
  },
  {
    label: 'America, St. Barthelemy',
    value: 'America/St_Barthelemy',
  },
  {
    label: 'America, St. Kitts',
    value: 'America/St_Kitts',
  },
  {
    label: 'America, St. Lucia',
    value: 'America/St_Lucia',
  },
  {
    label: 'America, St. Thomas',
    value: 'America/St_Thomas',
  },
  {
    label: 'America, St. Vincent',
    value: 'America/St_Vincent',
  },
  {
    label: 'America, Toronto',
    value: 'America/Toronto',
  },
  {
    label: 'America, Tortola',
    value: 'America/Tortola',
  },
  {
    label: 'America, Araguaina',
    value: 'America/Araguaina',
  },
  {
    label: 'America, Argentina, Buenos Aires',
    value: 'America/Argentina/Buenos_Aires',
  },
  {
    label: 'America, Argentina, Catamarca',
    value: 'America/Argentina/Catamarca',
  },
  {
    label: 'America, Argentina, Cordoba',
    value: 'America/Argentina/Cordoba',
  },
  {
    label: 'America, Argentina, Jujuy',
    value: 'America/Argentina/Jujuy',
  },
  {
    label: 'America, Argentina, La Rioja',
    value: 'America/Argentina/La_Rioja',
  },
  {
    label: 'America, Argentina, Mendoza',
    value: 'America/Argentina/Mendoza',
  },
  {
    label: 'America, Argentina, Rio Gallegos',
    value: 'America/Argentina/Rio_Gallegos',
  },
  {
    label: 'America, Argentina, Salta',
    value: 'America/Argentina/Salta',
  },
  {
    label: 'America, Argentina, San Juan',
    value: 'America/Argentina/San_Juan',
  },
  {
    label: 'America, Argentina, San Luis',
    value: 'America/Argentina/San_Luis',
  },
  {
    label: 'America, Argentina, Tucuman',
    value: 'America/Argentina/Tucuman',
  },
  {
    label: 'America, Argentina, Ushuaia',
    value: 'America/Argentina/Ushuaia',
  },
  {
    label: 'America, Bahia',
    value: 'America/Bahia',
  },
  {
    label: 'America, Belem',
    value: 'America/Belem',
  },
  {
    label: 'America, Cayenne',
    value: 'America/Cayenne',
  },
  {
    label: 'America, Fortaleza',
    value: 'America/Fortaleza',
  },
  {
    label: 'America, Glace Bay',
    value: 'America/Glace_Bay',
  },
  {
    label: 'America, Goose Bay',
    value: 'America/Goose_Bay',
  },
  {
    label: 'America, Halifax',
    value: 'America/Halifax',
  },
  {
    label: 'America, Maceio',
    value: 'America/Maceio',
  },
  {
    label: 'America, Moncton',
    value: 'America/Moncton',
  },
  {
    label: 'America, Montevideo',
    value: 'America/Montevideo',
  },
  {
    label: 'America, Paramaribo',
    value: 'America/Paramaribo',
  },
  {
    label: 'America, Punta Arenas',
    value: 'America/Punta_Arenas',
  },
  {
    label: 'America, Recife',
    value: 'America/Recife',
  },
  {
    label: 'America, Santarem',
    value: 'America/Santarem',
  },
  {
    label: 'America, Sao Paulo',
    value: 'America/Sao_Paulo',
  },
  {
    label: 'America, Thule',
    value: 'America/Thule',
  },
  {
    label: 'Antarctica, Palmer',
    value: 'Antarctica/Palmer',
  },
  {
    label: 'Antarctica, Rothera',
    value: 'Antarctica/Rothera',
  },
  {
    label: 'Atlantic, Bermuda',
    value: 'Atlantic/Bermuda',
  },
  {
    label: 'Atlantic, Stanley',
    value: 'Atlantic/Stanley',
  },
  {
    label: 'America, St. Johns',
    value: 'America/St_Johns',
  },
  {
    label: 'America, Miquelon',
    value: 'America/Miquelon',
  },
  {
    label: 'America, Noronha',
    value: 'America/Noronha',
  },
  {
    label: 'America, Nuuk',
    value: 'America/Nuuk',
  },
  {
    label: 'Atlantic, South Georgia',
    value: 'Atlantic/South_Georgia',
  },
  {
    label: 'Atlantic, Cape Verde',
    value: 'Atlantic/Cape_Verde',
  },
  {
    label: 'Africa, Abidjan',
    value: 'Africa/Abidjan',
  },
  {
    label: 'Africa, Accra',
    value: 'Africa/Accra',
  },
  {
    label: 'Africa, Bamako',
    value: 'Africa/Bamako',
  },
  {
    label: 'Africa, Banjul',
    value: 'Africa/Banjul',
  },
  {
    label: 'Africa, Bissau',
    value: 'Africa/Bissau',
  },
  {
    label: 'Africa, Conakry',
    value: 'Africa/Conakry',
  },
  {
    label: 'Africa, Dakar',
    value: 'Africa/Dakar',
  },
  {
    label: 'Africa, Freetown',
    value: 'Africa/Freetown',
  },
  {
    label: 'Africa, Lome',
    value: 'Africa/Lome',
  },
  {
    label: 'Africa, Monrovia',
    value: 'Africa/Monrovia',
  },
  {
    label: 'Africa, Nouakchott',
    value: 'Africa/Nouakchott',
  },
  {
    label: 'Africa, Ouagadougou',
    value: 'Africa/Ouagadougou',
  },
  {
    label: 'Africa, Sao Tome',
    value: 'Africa/Sao_Tome',
  },
  {
    label: 'America, Danmarkshavn',
    value: 'America/Danmarkshavn',
  },
  {
    label: 'America, Scoresbysund',
    value: 'America/Scoresbysund',
  },
  {
    label: 'Atlantic, Azores',
    value: 'Atlantic/Azores',
  },
  {
    label: 'Atlantic, Reykjavik',
    value: 'Atlantic/Reykjavik',
  },
  {
    label: 'Atlantic, St. Helena',
    value: 'Atlantic/St_Helena',
  },
  {
    label: 'UTC',
    value: 'UTC',
  },
  {
    label: 'Africa, Algiers',
    value: 'Africa/Algiers',
  },
  {
    label: 'Africa, Bangui',
    value: 'Africa/Bangui',
  },
  {
    label: 'Africa, Brazzaville',
    value: 'Africa/Brazzaville',
  },
  {
    label: 'Africa, Casablanca',
    value: 'Africa/Casablanca',
  },
  {
    label: 'Africa, Douala',
    value: 'Africa/Douala',
  },
  {
    label: 'Africa, El Aaiun',
    value: 'Africa/El_Aaiun',
  },
  {
    label: 'Africa, Kinshasa',
    value: 'Africa/Kinshasa',
  },
  {
    label: 'Africa, Lagos',
    value: 'Africa/Lagos',
  },
  {
    label: 'Africa, Libreville',
    value: 'Africa/Libreville',
  },
  {
    label: 'Africa, Luanda',
    value: 'Africa/Luanda',
  },
  {
    label: 'Africa, Malabo',
    value: 'Africa/Malabo',
  },
  {
    label: 'Africa, Ndjamena',
    value: 'Africa/Ndjamena',
  },
  {
    label: 'Africa, Niamey',
    value: 'Africa/Niamey',
  },
  {
    label: 'Africa, Porto-Novo',
    value: 'Africa/Porto-Novo',
  },
  {
    label: 'Africa, Tunis',
    value: 'Africa/Tunis',
  },
  {
    label: 'Atlantic, Canary',
    value: 'Atlantic/Canary',
  },
  {
    label: 'Atlantic, Faroe',
    value: 'Atlantic/Faroe',
  },
  {
    label: 'Atlantic, Madeira',
    value: 'Atlantic/Madeira',
  },
  {
    label: 'Europe, Dublin',
    value: 'Europe/Dublin',
  },
  {
    label: 'Europe, Guernsey',
    value: 'Europe/Guernsey',
  },
  {
    label: 'Europe, Isle of Man',
    value: 'Europe/Isle_of_Man',
  },
  {
    label: 'Europe, Jersey',
    value: 'Europe/Jersey',
  },
  {
    label: 'Europe, Lisbon',
    value: 'Europe/Lisbon',
  },
  {
    label: 'Europe, London',
    value: 'Europe/London',
  },
  {
    label: 'Africa, Blantyre',
    value: 'Africa/Blantyre',
  },
  {
    label: 'Africa, Bujumbura',
    value: 'Africa/Bujumbura',
  },
  {
    label: 'Africa, Ceuta',
    value: 'Africa/Ceuta',
  },
  {
    label: 'Africa, Gaborone',
    value: 'Africa/Gaborone',
  },
  {
    label: 'Africa, Harare',
    value: 'Africa/Harare',
  },
  {
    label: 'Africa, Johannesburg',
    value: 'Africa/Johannesburg',
  },
  {
    label: 'Africa, Juba',
    value: 'Africa/Juba',
  },
  {
    label: 'Africa, Khartoum',
    value: 'Africa/Khartoum',
  },
  {
    label: 'Africa, Kigali',
    value: 'Africa/Kigali',
  },
  {
    label: 'Africa, Lubumbashi',
    value: 'Africa/Lubumbashi',
  },
  {
    label: 'Africa, Lusaka',
    value: 'Africa/Lusaka',
  },
  {
    label: 'Africa, Maputo',
    value: 'Africa/Maputo',
  },
  {
    label: 'Africa, Maseru',
    value: 'Africa/Maseru',
  },
  {
    label: 'Africa, Mbabane',
    value: 'Africa/Mbabane',
  },
  {
    label: 'Africa, Tripoli',
    value: 'Africa/Tripoli',
  },
  {
    label: 'Africa, Windhoek',
    value: 'Africa/Windhoek',
  },
  {
    label: 'Antarctica, Troll',
    value: 'Antarctica/Troll',
  },
  {
    label: 'Arctic, Longyearbyen',
    value: 'Arctic/Longyearbyen',
  },
  {
    label: 'Europe, Amsterdam',
    value: 'Europe/Amsterdam',
  },
  {
    label: 'Europe, Andorra',
    value: 'Europe/Andorra',
  },
  {
    label: 'Europe, Belgrade',
    value: 'Europe/Belgrade',
  },
  {
    label: 'Europe, Berlin',
    value: 'Europe/Berlin',
  },
  {
    label: 'Europe, Bratislava',
    value: 'Europe/Bratislava',
  },
  {
    label: 'Europe, Brussels',
    value: 'Europe/Brussels',
  },
  {
    label: 'Europe, Budapest',
    value: 'Europe/Budapest',
  },
  {
    label: 'Europe, Busingen',
    value: 'Europe/Busingen',
  },
  {
    label: 'Europe, Copenhagen',
    value: 'Europe/Copenhagen',
  },
  {
    label: 'Europe, Gibraltar',
    value: 'Europe/Gibraltar',
  },
  {
    label: 'Europe, Kaliningrad',
    value: 'Europe/Kaliningrad',
  },
  {
    label: 'Europe, Ljubljana',
    value: 'Europe/Ljubljana',
  },
  {
    label: 'Europe, Luxembourg',
    value: 'Europe/Luxembourg',
  },
  {
    label: 'Europe, Madrid',
    value: 'Europe/Madrid',
  },
  {
    label: 'Europe, Malta',
    value: 'Europe/Malta',
  },
  {
    label: 'Europe, Monaco',
    value: 'Europe/Monaco',
  },
  {
    label: 'Europe, Oslo',
    value: 'Europe/Oslo',
  },
  {
    label: 'Europe, Paris',
    value: 'Europe/Paris',
  },
  {
    label: 'Europe, Podgorica',
    value: 'Europe/Podgorica',
  },
  {
    label: 'Europe, Prague',
    value: 'Europe/Prague',
  },
  {
    label: 'Europe, Rome',
    value: 'Europe/Rome',
  },
  {
    label: 'Europe, San Marino',
    value: 'Europe/San_Marino',
  },
  {
    label: 'Europe, Sarajevo',
    value: 'Europe/Sarajevo',
  },
  {
    label: 'Europe, Skopje',
    value: 'Europe/Skopje',
  },
  {
    label: 'Europe, Stockholm',
    value: 'Europe/Stockholm',
  },
  {
    label: 'Europe, Tirane',
    value: 'Europe/Tirane',
  },
  {
    label: 'Europe, Vaduz',
    value: 'Europe/Vaduz',
  },
  {
    label: 'Europe, Vatican',
    value: 'Europe/Vatican',
  },
  {
    label: 'Europe, Vienna',
    value: 'Europe/Vienna',
  },
  {
    label: 'Europe, Warsaw',
    value: 'Europe/Warsaw',
  },
  {
    label: 'Europe, Zagreb',
    value: 'Europe/Zagreb',
  },
  {
    label: 'Europe, Zurich',
    value: 'Europe/Zurich',
  },
  {
    label: 'Africa, Addis Ababa',
    value: 'Africa/Addis_Ababa',
  },
  {
    label: 'Africa, Asmara',
    value: 'Africa/Asmara',
  },
  {
    label: 'Africa, Cairo',
    value: 'Africa/Cairo',
  },
  {
    label: 'Africa, Dar es Salaam',
    value: 'Africa/Dar_es_Salaam',
  },
  {
    label: 'Africa, Djibouti',
    value: 'Africa/Djibouti',
  },
  {
    label: 'Africa, Kampala',
    value: 'Africa/Kampala',
  },
  {
    label: 'Africa, Mogadishu',
    value: 'Africa/Mogadishu',
  },
  {
    label: 'Africa, Nairobi',
    value: 'Africa/Nairobi',
  },
  {
    label: 'Antarctica, Syowa',
    value: 'Antarctica/Syowa',
  },
  {
    label: 'Asia, Aden',
    value: 'Asia/Aden',
  },
  {
    label: 'Asia, Amman',
    value: 'Asia/Amman',
  },
  {
    label: 'Asia, Baghdad',
    value: 'Asia/Baghdad',
  },
  {
    label: 'Asia, Bahrain',
    value: 'Asia/Bahrain',
  },
  {
    label: 'Asia, Beirut',
    value: 'Asia/Beirut',
  },
  {
    label: 'Asia, Damascus',
    value: 'Asia/Damascus',
  },
  {
    label: 'Asia, Famagusta',
    value: 'Asia/Famagusta',
  },
  {
    label: 'Asia, Gaza',
    value: 'Asia/Gaza',
  },
  {
    label: 'Asia, Hebron',
    value: 'Asia/Hebron',
  },
  {
    label: 'Asia, Jerusalem',
    value: 'Asia/Jerusalem',
  },
  {
    label: 'Asia, Kuwait',
    value: 'Asia/Kuwait',
  },
  {
    label: 'Asia, Nicosia',
    value: 'Asia/Nicosia',
  },
  {
    label: 'Asia, Qatar',
    value: 'Asia/Qatar',
  },
  {
    label: 'Asia, Riyadh',
    value: 'Asia/Riyadh',
  },
  {
    label: 'Europe, Athens',
    value: 'Europe/Athens',
  },
  {
    label: 'Europe, Bucharest',
    value: 'Europe/Bucharest',
  },
  {
    label: 'Europe, Chisinau',
    value: 'Europe/Chisinau',
  },
  {
    label: 'Europe, Helsinki',
    value: 'Europe/Helsinki',
  },
  {
    label: 'Europe, Istanbul',
    value: 'Europe/Istanbul',
  },
  {
    label: 'Europe, Kirov',
    value: 'Europe/Kirov',
  },
  {
    label: 'Europe, Kyiv',
    value: 'Europe/Kyiv',
  },
  {
    label: 'Europe, Mariehamn',
    value: 'Europe/Mariehamn',
  },
  {
    label: 'Europe, Minsk',
    value: 'Europe/Minsk',
  },
  {
    label: 'Europe, Moscow',
    value: 'Europe/Moscow',
  },
  {
    label: 'Europe, Riga',
    value: 'Europe/Riga',
  },
  {
    label: 'Europe, Simferopol',
    value: 'Europe/Simferopol',
  },
  {
    label: 'Europe, Sofia',
    value: 'Europe/Sofia',
  },
  {
    label: 'Europe, Tallinn',
    value: 'Europe/Tallinn',
  },
  {
    label: 'Europe, Vilnius',
    value: 'Europe/Vilnius',
  },
  {
    label: 'Europe, Volgograd',
    value: 'Europe/Volgograd',
  },
  {
    label: 'Indian, Antananarivo',
    value: 'Indian/Antananarivo',
  },
  {
    label: 'Indian, Comoro',
    value: 'Indian/Comoro',
  },
  {
    label: 'Indian, Mayotte',
    value: 'Indian/Mayotte',
  },
  {
    label: 'Asia, Tehran',
    value: 'Asia/Tehran',
  },
  {
    label: 'Asia, Baku',
    value: 'Asia/Baku',
  },
  {
    label: 'Asia, Dubai',
    value: 'Asia/Dubai',
  },
  {
    label: 'Asia, Muscat',
    value: 'Asia/Muscat',
  },
  {
    label: 'Asia, Tbilisi',
    value: 'Asia/Tbilisi',
  },
  {
    label: 'Asia, Yerevan',
    value: 'Asia/Yerevan',
  },
  {
    label: 'Europe, Astrakhan',
    value: 'Europe/Astrakhan',
  },
  {
    label: 'Europe, Samara',
    value: 'Europe/Samara',
  },
  {
    label: 'Europe, Saratov',
    value: 'Europe/Saratov',
  },
  {
    label: 'Europe, Ulyanovsk',
    value: 'Europe/Ulyanovsk',
  },
  {
    label: 'Indian, Mahe',
    value: 'Indian/Mahe',
  },
  {
    label: 'Indian, Mauritius',
    value: 'Indian/Mauritius',
  },
  {
    label: 'Indian, Reunion',
    value: 'Indian/Reunion',
  },
  {
    label: 'Asia, Kabul',
    value: 'Asia/Kabul',
  },
  {
    label: 'Antarctica, Mawson',
    value: 'Antarctica/Mawson',
  },
  {
    label: 'Asia, Aqtau',
    value: 'Asia/Aqtau',
  },
  {
    label: 'Asia, Aqtobe',
    value: 'Asia/Aqtobe',
  },
  {
    label: 'Asia, Ashgabat',
    value: 'Asia/Ashgabat',
  },
  {
    label: 'Asia, Atyrau',
    value: 'Asia/Atyrau',
  },
  {
    label: 'Asia, Dushanbe',
    value: 'Asia/Dushanbe',
  },
  {
    label: 'Asia, Karachi',
    value: 'Asia/Karachi',
  },
  {
    label: 'Asia, Oral',
    value: 'Asia/Oral',
  },
  {
    label: 'Asia, Qyzylorda',
    value: 'Asia/Qyzylorda',
  },
  {
    label: 'Asia, Samarkand',
    value: 'Asia/Samarkand',
  },
  {
    label: 'Asia, Tashkent',
    value: 'Asia/Tashkent',
  },
  {
    label: 'Asia, Yekaterinburg',
    value: 'Asia/Yekaterinburg',
  },
  {
    label: 'Indian, Kerguelen',
    value: 'Indian/Kerguelen',
  },
  {
    label: 'Indian, Maldives',
    value: 'Indian/Maldives',
  },
  {
    label: 'Asia, Colombo',
    value: 'Asia/Colombo',
  },
  {
    label: 'Asia, Kolkata',
    value: 'Asia/Kolkata',
  },
  {
    label: 'Asia, Kathmandu',
    value: 'Asia/Kathmandu',
  },
  {
    label: 'Antarctica, Vostok',
    value: 'Antarctica/Vostok',
  },
  {
    label: 'Asia, Almaty',
    value: 'Asia/Almaty',
  },
  {
    label: 'Asia, Bishkek',
    value: 'Asia/Bishkek',
  },
  {
    label: 'Asia, Dhaka',
    value: 'Asia/Dhaka',
  },
  {
    label: 'Asia, Omsk',
    value: 'Asia/Omsk',
  },
  {
    label: 'Asia, Qostanay',
    value: 'Asia/Qostanay',
  },
  {
    label: 'Asia, Thimphu',
    value: 'Asia/Thimphu',
  },
  {
    label: 'Asia, Urumqi',
    value: 'Asia/Urumqi',
  },
  {
    label: 'Indian, Chagos',
    value: 'Indian/Chagos',
  },
  {
    label: 'Asia, Yangon',
    value: 'Asia/Yangon',
  },
  {
    label: 'Indian, Cocos',
    value: 'Indian/Cocos',
  },
  {
    label: 'Antarctica, Davis',
    value: 'Antarctica/Davis',
  },
  {
    label: 'Asia, Bangkok',
    value: 'Asia/Bangkok',
  },
  {
    label: 'Asia, Barnaul',
    value: 'Asia/Barnaul',
  },
  {
    label: 'Asia, Ho Chi Minh',
    value: 'Asia/Ho_Chi_Minh',
  },
  {
    label: 'Asia, Hovd',
    value: 'Asia/Hovd',
  },
  {
    label: 'Asia, Jakarta',
    value: 'Asia/Jakarta',
  },
  {
    label: 'Asia, Krasnoyarsk',
    value: 'Asia/Krasnoyarsk',
  },
  {
    label: 'Asia, Novokuznetsk',
    value: 'Asia/Novokuznetsk',
  },
  {
    label: 'Asia, Novosibirsk',
    value: 'Asia/Novosibirsk',
  },
  {
    label: 'Asia, Phnom Penh',
    value: 'Asia/Phnom_Penh',
  },
  {
    label: 'Asia, Pontianak',
    value: 'Asia/Pontianak',
  },
  {
    label: 'Asia, Tomsk',
    value: 'Asia/Tomsk',
  },
  {
    label: 'Asia, Vientiane',
    value: 'Asia/Vientiane',
  },
  {
    label: 'Indian, Christmas',
    value: 'Indian/Christmas',
  },
  {
    label: 'Asia, Brunei',
    value: 'Asia/Brunei',
  },
  {
    label: 'Asia, Choibalsan',
    value: 'Asia/Choibalsan',
  },
  {
    label: 'Asia, Hong Kong',
    value: 'Asia/Hong_Kong',
  },
  {
    label: 'Asia, Irkutsk',
    value: 'Asia/Irkutsk',
  },
  {
    label: 'Asia, Kuala Lumpur',
    value: 'Asia/Kuala_Lumpur',
  },
  {
    label: 'Asia, Kuching',
    value: 'Asia/Kuching',
  },
  {
    label: 'Asia, Macau',
    value: 'Asia/Macau',
  },
  {
    label: 'Asia, Makassar',
    value: 'Asia/Makassar',
  },
  {
    label: 'Asia, Manila',
    value: 'Asia/Manila',
  },
  {
    label: 'Asia, Shanghai',
    value: 'Asia/Shanghai',
  },
  {
    label: 'Asia, Singapore',
    value: 'Asia/Singapore',
  },
  {
    label: 'Asia, Taipei',
    value: 'Asia/Taipei',
  },
  {
    label: 'Asia, Ulaanbaatar',
    value: 'Asia/Ulaanbaatar',
  },
  {
    label: 'Australia, Perth',
    value: 'Australia/Perth',
  },
  {
    label: 'Australia, Eucla',
    value: 'Australia/Eucla',
  },
  {
    label: 'Asia, Chita',
    value: 'Asia/Chita',
  },
  {
    label: 'Asia, Dili',
    value: 'Asia/Dili',
  },
  {
    label: 'Asia, Jayapura',
    value: 'Asia/Jayapura',
  },
  {
    label: 'Asia, Khandyga',
    value: 'Asia/Khandyga',
  },
  {
    label: 'Asia, Pyongyang',
    value: 'Asia/Pyongyang',
  },
  {
    label: 'Asia, Seoul',
    value: 'Asia/Seoul',
  },
  {
    label: 'Asia, Tokyo',
    value: 'Asia/Tokyo',
  },
  {
    label: 'Asia, Yakutsk',
    value: 'Asia/Yakutsk',
  },
  {
    label: 'Pacific, Palau',
    value: 'Pacific/Palau',
  },
  {
    label: 'Australia, Adelaide',
    value: 'Australia/Adelaide',
  },
  {
    label: 'Australia, Broken Hill',
    value: 'Australia/Broken_Hill',
  },
  {
    label: 'Australia, Darwin',
    value: 'Australia/Darwin',
  },
  {
    label: 'Antarctica, DumontDUrville',
    value: 'Antarctica/DumontDUrville',
  },
  {
    label: 'Antarctica, Macquarie',
    value: 'Antarctica/Macquarie',
  },
  {
    label: 'Asia, Ust-Nera',
    value: 'Asia/Ust-Nera',
  },
  {
    label: 'Asia, Vladivostok',
    value: 'Asia/Vladivostok',
  },
  {
    label: 'Australia, Brisbane',
    value: 'Australia/Brisbane',
  },
  {
    label: 'Australia, Hobart',
    value: 'Australia/Hobart',
  },
  {
    label: 'Australia, Lindeman',
    value: 'Australia/Lindeman',
  },
  {
    label: 'Australia, Melbourne',
    value: 'Australia/Melbourne',
  },
  {
    label: 'Australia, Sydney',
    value: 'Australia/Sydney',
  },
  {
    label: 'Pacific, Chuuk',
    value: 'Pacific/Chuuk',
  },
  {
    label: 'Pacific, Guam',
    value: 'Pacific/Guam',
  },
  {
    label: 'Pacific, Port Moresby',
    value: 'Pacific/Port_Moresby',
  },
  {
    label: 'Pacific, Saipan',
    value: 'Pacific/Saipan',
  },
  {
    label: 'Australia, Lord Howe',
    value: 'Australia/Lord_Howe',
  },
  {
    label: 'Antarctica, Casey',
    value: 'Antarctica/Casey',
  },
  {
    label: 'Asia, Magadan',
    value: 'Asia/Magadan',
  },
  {
    label: 'Asia, Sakhalin',
    value: 'Asia/Sakhalin',
  },
  {
    label: 'Asia, Srednekolymsk',
    value: 'Asia/Srednekolymsk',
  },
  {
    label: 'Pacific, Bougainville',
    value: 'Pacific/Bougainville',
  },
  {
    label: 'Pacific, Efate',
    value: 'Pacific/Efate',
  },
  {
    label: 'Pacific, Guadalcanal',
    value: 'Pacific/Guadalcanal',
  },
  {
    label: 'Pacific, Kosrae',
    value: 'Pacific/Kosrae',
  },
  {
    label: 'Pacific, Norfolk',
    value: 'Pacific/Norfolk',
  },
  {
    label: 'Pacific, Noumea',
    value: 'Pacific/Noumea',
  },
  {
    label: 'Pacific, Pohnpei',
    value: 'Pacific/Pohnpei',
  },
  {
    label: 'Antarctica, McMurdo',
    value: 'Antarctica/McMurdo',
  },
  {
    label: 'Asia, Anadyr',
    value: 'Asia/Anadyr',
  },
  {
    label: 'Asia, Kamchatka',
    value: 'Asia/Kamchatka',
  },
  {
    label: 'Pacific, Auckland',
    value: 'Pacific/Auckland',
  },
  {
    label: 'Pacific, Fiji',
    value: 'Pacific/Fiji',
  },
  {
    label: 'Pacific, Funafuti',
    value: 'Pacific/Funafuti',
  },
  {
    label: 'Pacific, Kwajalein',
    value: 'Pacific/Kwajalein',
  },
  {
    label: 'Pacific, Majuro',
    value: 'Pacific/Majuro',
  },
  {
    label: 'Pacific, Nauru',
    value: 'Pacific/Nauru',
  },
  {
    label: 'Pacific, Tarawa',
    value: 'Pacific/Tarawa',
  },
  {
    label: 'Pacific, Wake',
    value: 'Pacific/Wake',
  },
  {
    label: 'Pacific, Wallis',
    value: 'Pacific/Wallis',
  },
  {
    label: 'Pacific, Chatham',
    value: 'Pacific/Chatham',
  },
  {
    label: 'Pacific, Apia',
    value: 'Pacific/Apia',
  },
  {
    label: 'Pacific, Fakaofo',
    value: 'Pacific/Fakaofo',
  },
  {
    label: 'Pacific, Kanton',
    value: 'Pacific/Kanton',
  },
  {
    label: 'Pacific, Tongatapu',
    value: 'Pacific/Tongatapu',
  },
  {
    label: 'Pacific, Kiritimati',
    value: 'Pacific/Kiritimati',
  },
];

export const timezoneOptions = TIMEZONES.map(({ label, value }) => ({
  value,
  offsets: yearlyOffsets(value),
  label,
}))
  .sort((a, b) => offsetMinutes(a.offsets[0]) - offsetMinutes(b.offsets[0]))
  .map(({ value, offsets, label }) => ({
    label: `(GMT${offsets.join('/')}) ${label}`,
    value,
  }));
