import { listPublicationsAiAction } from './list-publications.action';
import { listSubscriptionsAiAction } from './list-subscriptions.action';
import { getSubscriptionAiAction } from './get-subscription.action';
import { createSubscriptionAiAction } from './create-subscription.action';
import { updateSubscriptionAiAction } from './update-subscription.action';
import { unsubscribeSubscriptionAiAction } from './unsubscribe-subscription.action';
import { deleteSubscriptionAiAction } from './delete-subscription.action';
import { addSubscriptionTagsAiAction } from './add-subscription-tags.action';
import { removeSubscriptionTagsAiAction } from './remove-subscription-tags.action';
import { listCustomFieldsAiAction } from './list-custom-fields.action';
import { createCustomFieldAiAction } from './create-custom-field.action';
import { listTiersAiAction } from './list-tiers.action';
import { listNewsletterListsAiAction } from './list-newsletter-lists.action';
import { listSegmentsAiAction } from './list-segments.action';
import { listSegmentMembersAiAction } from './list-segment-members.action';
import { createSegmentAiAction } from './create-segment.action';
import { getPostAiAction } from './get-post.action';
import { getAggregatePostStatsAiAction } from './get-aggregate-post-stats.action';
import { deletePostAiAction } from './delete-post.action';
import { createDraftPostAiAction } from './create-draft-post.action';
import { listPostTemplatesAiAction } from './list-post-templates.action';
import { getPublicationEngagementsAiAction } from './get-publication-engagements.action';

export const beehiivAiActions = [
	listPublicationsAiAction,
	listSubscriptionsAiAction,
	getSubscriptionAiAction,
	createSubscriptionAiAction,
	updateSubscriptionAiAction,
	unsubscribeSubscriptionAiAction,
	deleteSubscriptionAiAction,
	addSubscriptionTagsAiAction,
	removeSubscriptionTagsAiAction,
	listCustomFieldsAiAction,
	createCustomFieldAiAction,
	listTiersAiAction,
	listNewsletterListsAiAction,
	listSegmentsAiAction,
	listSegmentMembersAiAction,
	createSegmentAiAction,
	getPostAiAction,
	getAggregatePostStatsAiAction,
	deletePostAiAction,
	createDraftPostAiAction,
	listPostTemplatesAiAction,
	getPublicationEngagementsAiAction,
];
