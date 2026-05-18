export interface Broadcast {
  id: string;
  created_at: string;
  subject: string;
}

export interface CustomField {
  id: string;
  label: string;
  key: string;
  name: string;
}

export interface Form {
  id: string;
  name: string;
  created_at: string;
  type: string;
  format: string;
  embed_js: string;
  embed_url: string;
  archived: boolean;
  uid: string;
}

export interface Subscription {
  id: string;
  state: string;
  created_at: string;
  source: string;
  referrer: string;
  subscribable_id: string;
  subscribable_type: string;
  subscriber: Subscriber;
}

export interface Subscriber {
  id: string;
  first_name: string;
  email_address: string;
  state: string;
  created_at: string;
  fields: Fields;
}

export interface Fields {
  [key: string]: string;
}

export interface Purchase {
  id: string;
  transaction_id: string;
  status: string;
  email_address: string;
  currency: string;
  transaction_time: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  products: Product[];
}

export interface Product {
  quantity: number;
  lid: string;
  unit_price: number;
  sku: string;
  name: string;
  pid: string;
}

export interface Sequence {
  id: string;
  name: string;
  hold: boolean;
  repeat: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export enum EventType {
  subscriberActivate = 'subscriber.subscriber_activate',
  subscriberUnsubscribe = 'subscriber.subscriber_unsubscribe',
  subscriberBounce = 'subscriber.subscriber_bounce',
  subscriberComplain = 'subscriber.subscriber_complain',
  formSubscribe = 'subscriber.form_subscribe',
  courseSubscribe = 'subscriber.course_subscribe',
  courseComplete = 'subscriber.course_complete',
  linkClick = 'subscriber.link_click',
  productPurchase = 'subscriber.product_purchase',
  tagAdd = 'subscriber.tag_add',
  tagRemove = 'subscriber.tag_remove',
  purchaseCreate = 'purchase.purchase_create',
}

export type EventParameterKey =
  | 'form_id'
  | 'sequence_id'
  | 'initiator_value'
  | 'product_id'
  | 'tag_id';

type EventMapped = {
  [K in EventParameterKey]?: string | number;
};

export type Event = EventMapped & {
  name: EventType;
};

export interface Webhook {
  id: number;
  account_id: number;
  event: Event;
  target_url: string;
}

export interface EventOption {
  label: string;
  value: EventType;
  required_parameter: EventParameterKey | null;
  param_label: string | null;
  type: string | null;
}

export interface AuthEmail {
  auth: string;
  email: string;
}
