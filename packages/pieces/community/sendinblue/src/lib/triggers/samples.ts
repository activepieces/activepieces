const transactionalEmail = {
	id: 2152078,
	email: 'contact@example.com',
	'message-id': '<202608251105.84807994032@smtp-relay.mailin.fr>',
	date: '2026-08-25 14:05:36',
	tags: ['welcome_series'],
	tag: '["welcome_series"]',
	subject: 'Your receipt',
	sending_ip: '77.32.148.25',
	ts_event: 1787655936,
	ts: 1787655936,
	ts_epoch: 1787655936000,
	sender_email: 'sender@example.com',
	uuid: 'daf7778b-13f8-4db8-9f05-a65c1795ae21',
};

const engagement = {
	...transactionalEmail,
	user_agent: 'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0',
	device_used: 'DESKTOP',
};

export const brevoSamples = { transactionalEmail, engagement };

export const WEBHOOK_ID_NOTE =
	'Note that the payload id field is the Brevo webhook id, not the contact id — identify the contact by email.';
