export const BASE_URL = 'https://api.zagomail.com';

export const API_ENDPOINTS = {
  CREATE_SUBSCRIBER: '/lists/subscriber-create',
  UPDATE_SUBSCRIBER: '/lists/subscriber-update',
  UNSUBSCRIBE_SUBSCRIBER: '/lists/unsubscribe-subscriber',
  SEARCH_SUBSCRIBER_BY_EMAIL: '/lists/search-by-email',
  GET_SUBSCRIBER: '/lists/get-subscriber',
  GET_CAMPAIGNS: '/campaigns/get-stats',
  ADD_TAG_TO_SUBSCRIBER: '/lists/add-tag',
  GET_TAGS: '/tags/get-tags',
  CREATE_TAG: '/tags/create-tag',
  CREATE_WEBHOOK: '/webhooks/create',
  DELETE_WEBHOOK: '/webhooks/delete',
  LIST_ALL_LISTS : '/lists/all-lists',
  GET_LIST_FIELDS:'/lists/get-fields'
};


export type WebhookResponse = {
  id: string;
  event_type: string;
  target_url: string;
  form_id: string | null;
  tag_id: string | null;
  link_url: string | null;
};

export type StoredWebhookId = {
  webhookId: string;
};

export interface Tag {
  ztag_id: string;
  ztag_name: string;
  customer_id: number;
  created_on: Date;
}