import { Piece } from '@activepieces/framework';
import { airtable } from '@activepieces/piece-airtable';
import { asana } from '@activepieces/piece-asana';
import { bannerbear } from '@activepieces/piece-bannerbear';
import { binance } from '@activepieces/piece-binance';
import { blackbaud } from '@activepieces/piece-blackbaud';
import { calcom } from '@activepieces/piece-cal-com';
import { calendly } from '@activepieces/piece-calendly';
import { clickup } from '@activepieces/piece-clickup';
import { csv } from '@activepieces/piece-csv';
import { discord } from '@activepieces/piece-discord';
import { slack } from '@activepieces/piece-slack';
import { drip } from './lib/drip';
import { dropbox } from './lib/dropbox';
import { figma } from './lib/figma';
import { github } from './lib/github';
import { gmail } from './lib/gmail';
import { googleCalendar } from './lib/google-calendar';
import { googleContacts } from './lib/google-contacts';
import { googleDrive } from './lib/google-drive';
import { googleSheets } from './lib/google-sheets';
import { hackernews } from './lib/hackernews';
import { http } from './lib/http';
import { hubspot } from './lib/hubspot';
import { mailchimp } from './lib/mailchimp';
import { openai } from './lib/openai';
import { pipedrive } from './lib/pipedrive';
import { rssFeed } from './lib/rss';
import { sendgrid } from './lib/sendgrid';
import { stripe } from './lib/stripe';
import { telegramBot } from './lib/telegram_bot';
import { todoist } from './lib/todoist';
import { twilio } from './lib/twilio';
import { typeform } from './lib/typeform';
import { zoom } from './lib/zoom';
import { storage } from './lib/store';
import { freshsales } from './lib/freshsales';
import { googleTasks } from './lib/google-tasks';
import { posthog } from './lib/posthog';
import { wordpress } from './lib/wordpress';

export const pieces: Piece[] = [
    airtable,
    asana,
    bannerbear,
    binance,
    blackbaud,
    calcom,
    calendly,
    csv,
    clickup,
    discord,
    drip,
    dropbox,
    figma,
    freshsales,
    github,
    gmail,
    googleCalendar,
    googleContacts,
    googleDrive,
    googleSheets,
    googleTasks,
    hackernews,
    http,
    hubspot,
    mailchimp,
    openai,
    pipedrive,
    posthog,
    rssFeed,
    sendgrid,
    slack,
    storage,
    stripe,
    telegramBot,
    todoist,
    twilio,
    typeform,
    wordpress,
    zoom
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

export const getPiece = (name: string): Piece | undefined => {
    return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
