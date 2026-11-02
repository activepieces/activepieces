import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { messageSendOutputSchema } from '../output-schemas';

export const sendLocation = createAction({
	auth: whatsappAuth,
	name: 'send_location',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Location',
	description: 'Sends a map pin for a latitude and longitude.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a WhatsApp location message that renders as a map pin, with an optional place name and address. Choose this over Send Message when the payload is a physical place rather than text. Free-form, so it only delivers inside the 24-hour customer service window. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		latitude: Property.Number({
			displayName: 'Latitude',
			description: 'Decimal degrees, for example 31.9539.',
			required: true,
		}),
		longitude: Property.Number({
			displayName: 'Longitude',
			description: 'Decimal degrees, for example 35.9106.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Location Name',
			description: 'Title shown under the map pin, for example a venue or shop name.',
			required: false,
		}),
		address: Property.ShortText({
			displayName: 'Address',
			description: 'Street address shown under the name. Only displayed when a name is also set.',
			required: false,
		}),
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const { phone_number_id, to, latitude, longitude, name, address, reply_to_message_id } = context.propsValue;
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			replyToMessageId: reply_to_message_id,
			payload: {
				type: 'location',
				location: {
					latitude: String(latitude),
					longitude: String(longitude),
					...(name ? { name } : {}),
					...(address ? { address } : {}),
				},
			},
		});
	},
});
