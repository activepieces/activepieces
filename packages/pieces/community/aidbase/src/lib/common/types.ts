export interface KnowledgeItem {
  id: string;
  type: 'faq' | 'website' | 'video' | 'document';
  title?: string;
  base_url?: string;
}

export interface ListKnowledgeItemsResponse {
  items: KnowledgeItem[];
}

export interface AddFaqItemParams {
  question: string;
  answer: string;
  source_url?: string;
  categories?: string[];
}

export interface CreateFaqParams {
  title: string;
  description?: string;
}

export interface Chatbot {
  id: string;
  title: string;
}

export interface ListChatbotsResponse {
  items: Chatbot[];
}

export interface CreateReplyParams {
  message: string;
  session_id?: string;
}
