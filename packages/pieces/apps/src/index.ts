import { Piece } from '@activepieces/pieces-framework';
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
import { monday } from '@activepieces/piece-monday';
import { mindee } from '@activepieces/piece-mindee';
import { openai } from '@activepieces/piece-openai';
import { pipedrive } from '@activepieces/piece-pipedrive';
import { posthog } from '@activepieces/piece-posthog';
import { rssFeed } from '@activepieces/piece-rss';
import { sendgrid } from '@activepieces/piece-sendgrid';
import { sendinblue } from '@activepieces/piece-sendinblue';
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
import { notion } from '@activepieces/piece-notion';
import { youtube } from '@activepieces/piece-youtube';
import { intercom } from '@activepieces/piece-intercom';
import { trello } from '@activepieces/piece-trello';
import { square } from '@activepieces/piece-square';
import { xero } from '@activepieces/piece-xero';
import { delay } from '@activepieces/piece-delay';
import { dataMapper } from '@activepieces/piece-data-mapper';
import { schedule } from '@activepieces/piece-schedule';
import { zohoCrm } from '@activepieces/piece-zoho-crm';
import { zendesk } from '@activepieces/piece-zendesk';
import { mattermost } from '@activepieces/piece-mattermost';
import { mastodon } from '@activepieces/piece-mastodon';
import { shopify } from '@activepieces/piece-shopify';
import { constantContact } from '@activepieces/piece-constant-contact';
import { salesforce } from '@activepieces/piece-salesforce';
import { matrix } from "@activepieces/piece-matrix";
import { smtp } from '@activepieces/piece-smtp';
import { mailerLite } from '@activepieces/piece-mailer-lite';
import { googleForms }  from '@activepieces/piece-google-forms';
import { xml }  from '@activepieces/piece-xml';
import { vtex }  from '@activepieces/piece-vtex';
import { postgres }  from '@activepieces/piece-postgres';
import { amazonS3 }  from '@activepieces/piece-amazon-s3';
import { stabilityAi }  from '@activepieces/piece-stability-ai';
import { mautic }  from '@activepieces/piece-mautic';
import { twitter } from '@activepieces/piece-twitter';
import { clockodo } from '@activepieces/piece-clockodo';
import { mysql } from '@activepieces/piece-mysql'

/**
 * @deprecated this will be removed, don't use it
 */
export const pieces: Piece[] = [
    mautic,
    stabilityAi,
    amazonS3,
    xml,
    vtex,
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
    monday,
    mailerLite,
    mindee,
    openai,
    pipedrive,
    posthog,
    rssFeed,
    sendgrid,
    sendinblue,
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
    notion,
    youtube,
    square,
    delay,
    dataMapper,
    intercom,
    schedule,
    xero,
    zohoCrm,
    zendesk,
    mattermost,
    mastodon,
    shopify,
    constantContact,
    salesforce,
    matrix,
    smtp,
    googleForms,
    postgres,
    twitter,
    clockodo,
    mysql
].sort((a, b) => a.displayName > b.displayName ? 1 : -1);

/**
 * @deprecated this will be removed, don't use it
 */
export const getPiece = (name: string): Piece | undefined => {
    return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
