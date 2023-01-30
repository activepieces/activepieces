import type { Piece } from '../framework/piece';
import { gmail } from './gmail';
import { slack } from './slack';
import { github } from './github';
import { discord } from './discord';
import { hackernews } from './hackernews';
import { hubspot } from './hubspot';
import { mailchimp } from './mailchimp';
import { openai } from './openai';
import { stripe } from './stripe';
import { blackbaud } from './blackbaud';
import { pipedrive } from './pipedrive';
import { googleContacts } from './google-contacts';
import { googleSheets } from './google-sheets';
import { sendgrid } from './sendgrid';
import { clickup } from './clickup';
import { drip } from './drip';


export const pieces: Piece[] = [
	slack,
	gmail,
	discord,
	github,
	hubspot,
	hackernews,
	mailchimp,
	openai,
	stripe,
	blackbaud,
	clickup,
	googleSheets,
	pipedrive,
	googleContacts,
	sendgrid,
	drip
];

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find((f) => name.toLowerCase() === f.name.toLowerCase());
};
