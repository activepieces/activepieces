import { Piece } from '@activepieces/framework';
import { slack } from '@activepieces/piece-slack';
import { asana } from './lib/asana';
import { binance } from './lib/binance';
import { blackbaud } from './lib/blackbaud';
import { calendly } from './lib/calendly';
import { clickup } from './lib/clickup';
import { discord } from './lib/discord';
import { drip } from './lib/drip';
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
import { sendgrid } from './lib/sendgrid';
import { stripe } from './lib/stripe';
import { telegramBot } from './lib/telegram_bot';
import { todoist } from './lib/todoist';
import { twilio } from './lib/twilio';
import { typeform } from './lib/typeform';
import { zoom } from './lib/zoom';

export const pieces: Piece[] = [
    asana,
    binance,
    blackbaud,
    calendly,
    clickup,
    discord,
    drip,
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
    sendgrid,
    slack,
    stripe,
    telegramBot,
    todoist,
    twilio,
    typeform,
    zoom,
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
