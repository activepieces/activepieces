import {createAction} from '../../../framework/action/action';
import {InputDataType} from '../../../framework/config/input-data-type.model';
import {InputRequestLocation} from '../../../framework/config/input-request-location.model';
import {InputUiType} from '../../../framework/config/input-ui-type.model';
import * as nodemailer from 'nodemailer';
export const gmailSendEmailAction = createAction({
	name: 'Send Email',
	description: 'Send an email through a Gmail account',
	configs: [
		{
			name: 'sender',
			displayName: 'Sender Email (From)',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'reciever',
			displayName: 'Reciever Email (To)',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'subject',
			displayName: 'Subject',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'bodyText',
			displayName: 'Body (Text)',
			description: 'Text version of the body for the email you want to send',
			uiType: InputUiType.LONG_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'bodyHml',
			displayName: 'Body (HTML)',
			description: 'HTML version of the body for the email you want to send',
			uiType: InputUiType.LONG_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
	],
	async runner(configValue) {
		if (!configValue.authentication.clientSecret) {
			throw new Error('Client Secret is empty');
		}

		if (!configValue.authentication.clientId) {
			throw new Error('Client Id is empty');
		}

		const transport = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: configValue.inputs.sender,
				clientId: configValue.authentication.clientId,
				clientSecret: configValue.authentication.clientSecret,
				refreshToken: configValue.authentication.refreshToken,
				accessToken: configValue.authentication.accessToken,
			},
		});
		const mailOptions = {
			from: configValue.inputs.sender,
			to: configValue.inputs.reciever,
			subject: configValue.inputs.subject,
			text: configValue.inputs.bodyText,
			html: configValue.inputs.bodyHtml,
		};

		const result = await transport.sendMail(mailOptions);
		console.log(result);
		return {
			success: true,
		};
	},
});
