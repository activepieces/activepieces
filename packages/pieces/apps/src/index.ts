import { Piece } from '@activepieces/framework';
import { slack } from '@activepieces/piece-slack';
import { airtable } from './lib/airtable';
import { asana } from './lib/asana';
import { binance } from './lib/binance';
import { blackbaud } from './lib/blackbaud';
import { calendly } from './lib/calendly';
import { clickup } from './lib/clickup';
import { discord } from './lib/discord';
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
import { calcom } from './lib/cal-com';
import { posthog } from './lib/posthog';

export const pieces: Piece[] = [
    airtable,
    asana,
    binance,
    blackbaud,
    calendly,
    clickup,
    discord,
    drip,
    dropbox,
    figma,
    github,
    gmail,
    googleCalendar,
    googleContacts,
    googleDrive,
    googleSheets,
    hackernews,
    http,
    hubspot,
    mailchimp,
    openai,
    pipedrive,
    rssFeed,
    sendgrid,
    slack,
    stripe,
    telegramBot,
    todoist,
    twilio,
    typeform,
    zoom,
    storage,
    calcom,
    posthog
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
