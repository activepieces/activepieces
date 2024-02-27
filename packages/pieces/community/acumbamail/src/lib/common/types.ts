import { SubscriberListFieldType } from './constants';

export type CreateListParams = {
  sender_email: string;
  name: string;
  company?: string;
  address?: string;
  phone?: string;
};

export type GetListsResponse = {
  [key: string]: {
    name: string;
  };
};

export type GetTemplatesResponse = {
  id: number;
  name: string;
};

export type SubscriberListField = {
  name: string;
  label: string;
  readonly: boolean;
  tag: string;
  hidden: boolean;
  type: SubscriberListFieldType;
  options?: { label: string }[];
};
