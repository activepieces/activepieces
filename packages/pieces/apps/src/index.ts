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
import { drip } from '@activepieces/piece-drip';
import { dropbox } from '@activepieces/piece-dropbox';
import { figma } from '@activepieces/piece-figma';
import { freshsales } from '@activepieces/piece-freshsales';
import { github } from '@activepieces/piece-github';
import { gmail } from '@activepieces/piece-gmail';
import { googleCalendar } from '@activepieces/piece-google-calendar';
import { googleContacts } from '@activepieces/piece-google-contacts';
import { googleDrive } from '@activepieces/piece-google-drive';
import { googleSheets } from '@activepieces/piece-google-sheets';
import { googleTasks } from '@activepieces/piece-google-tasks';
import { hackernews } from '@activepieces/piece-hackernews';
import { http } from '@activepieces/piece-http';
import { hubspot } from '@activepieces/piece-hubspot';
import { mailchimp } from '@activepieces/piece-mailchimp';
import { openai } from '@activepieces/piece-openai';
import { pipedrive } from '@activepieces/piece-pipedrive';
import { posthog } from '@activepieces/piece-posthog';
import { rssFeed } from '@activepieces/piece-rss';
import { sendgrid } from '@activepieces/piece-sendgrid';
import { slack } from '@activepieces/piece-slack';
import { storage } from '@activepieces/piece-store';
import { stripe } from '@activepieces/piece-stripe';
import { telegramBot } from '@activepieces/piece-telegram-bot';
import { todoist } from '@activepieces/piece-todoist';
import { twilio } from '@activepieces/piece-twilio';
import { typeform } from '@activepieces/piece-typeform';
import { wordpress } from '@activepieces/piece-wordpress';
import { zoom } from '@activepieces/piece-zoom';
import { generatebanners } from '@activepieces/piece-generatebanners';
import { connections } from '@activepieces/piece-connections';
import { youtube } from '@activepieces/piece-youtube';
import { trello } from '@activepieces/piece-trello';

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
    generatebanners,
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
    trello,
    wordpress,
    zoom,
    connections,
    youtube,
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

export const getPiece = (name: string): Piece | undefined => {
    return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
