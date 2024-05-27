import { trelloAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { getCardDetail, getCardsInList, trelloCommon } from '../common';
import { TrelloCardMoved } from '../common/props/card';
import { isNil } from '@activepieces/shared';

export const cardMovedTrigger = createTrigger({
	auth: trelloAuth,
	name: 'card_moved_to_list',
	displayName: 'Card Moved to list',
	description: 'Trigger when a card is moved to the list specified',
	props: {
		board_id: trelloCommon.board_id,
		list_id: trelloCommon.list_id,
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const element_id = context.propsValue.list_id;
		const webhooks = await trelloCommon.list_webhooks(context.auth);
		const webhook = webhooks.find(
			(webhook) => webhook.idModel === element_id && webhook.callbackURL === context.webhookUrl,
		);
		if (webhook) {
			context.webhookUrl = webhook.callbackURL;
			return;
		}
		const response = await trelloCommon.create_webhook(
			context.auth,
			element_id,
			context.webhookUrl,
		);
		await context.store.put('webhook_id', response.id);
	},
	async onDisable(context) {
		const webhook_id = (await context.store.get('webhook_id')) as string;
		if (isNil(webhook_id)) {
			return;
		}
		const webhooks = await trelloCommon.list_webhooks(context.auth);
		const webhook = webhooks.find((webhook) => webhook.callbackURL === context.webhookUrl);
		if (!webhook) {
			return;
		}
		await trelloCommon.delete_webhook(context.auth, webhook_id);
	},
	async run(context) {
		const response = context.payload.body as TrelloCardMoved;
		const response_body = response.action.display;
		if (response.action.display.translationKey !== 'action_move_card_from_list_to_list') {
			return [];
		}
		if (response_body.entities.listAfter.id !== context.propsValue.list_id) {
			return [];
		}
		if (response_body.entities.listBefore.id === context.propsValue.list_id) {
			return [];
		}
		const card = await getCardDetail(
			context.auth.username,
			context.auth.password,
			response_body.entities.card.id,
		);
		return [card];
	},
	async test(context) {
		let cards: Array<Record<string, unknown>> = [];
		try {
			cards = await getCardsInList(
				context.auth.username,
				context.auth.password,
				context.propsValue.list_id,
			);

			cards.sort(
				(a: any, b: any) =>
					new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime(),
			);

			return cards.slice(0, 5);
		} catch (error) {
			console.error('An error occurred:', error);
			return [];
		}
	},
	sampleData: {
		id: '6651d6d6298164adb4a598b6',
		badges: {
			attachmentsByType: { trello: { board: 0, card: 0 } },
			externalSource: null,
			location: false,
			votes: 0,
			viewingMemberVoted: false,
			subscribed: false,
			attachments: 0,
			fogbugz: '',
			checkItems: 0,
			checkItemsChecked: 0,
			checkItemsEarliestDue: null,
			comments: 0,
			description: false,
			due: null,
			dueComplete: false,
			lastUpdatedByAi: false,
			start: null,
		},
		checkItemStates: [],
		closed: false,
		dueComplete: false,
		dateLastActivity: '2024-05-25T12:17:26.372Z',
		desc: '',
		descData: { emoji: {} },
		due: null,
		dueReminder: null,
		email: null,
		idBoard: '6639c3a2f9a2ecd2b53adcc4',
		idChecklists: [],
		idList: '6639c3a342f39d7f6ff9e9b0',
		idMembers: [],
		idMembersVoted: [],
		idShort: 11,
		idAttachmentCover: null,
		labels: [],
		idLabels: [],
		manualCoverAttachment: false,
		name: 'TEST CARDS',
		pos: 196608,
		shortLink: '57tgmppm',
		shortUrl: 'https://trello.com/c/57tghpk',
		start: null,
		subscribed: false,
		url: 'https://trello.com/c/57tkkppm/11-again-cards',
		cover: {
			idAttachment: null,
			color: null,
			idUploadedBackground: null,
			size: 'normal',
			brightness: 'dark',
			idPlugin: null,
		},
		isTemplate: false,
		cardRole: null,
	},
});
