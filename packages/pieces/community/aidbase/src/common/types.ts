// Common Types for Aidbase Integration
interface AuthenticationParams {
  apiKey: string;
}

export interface Answer {
  id: string;
  type: 'paragraph';
  nodeType: 'block';
  children: { text: string }[];
}

export interface Rating {
  upvotes: number;
  downvotes: number;
}

export interface ChatbotData {
  id: string;
  public_id: string;
  title: string;
  allowed_domains: string[];
}

export interface AddVideoData {
  id: string;
  type: 'video';
  video_id: string;
  video_url: string;
  video_type: 'YOUTUBE';
}

export interface CreateFaqData {
  id: string;
  type: 'faq';
  title: string;
  description?: string;
}

export interface KnowledgeItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  trained_at: string | null;
  is_training: boolean;
  training_failed_at: string | null;
  training_failed_with: string | null;
}

export interface AddFaqItemData {
  id: string;
  question: string;
  answer: Answer[];
  source_url: string;
  rating: Rating;
  categories: string[];
}

export interface AddWebsiteData {
  id: string;
  type: 'website';
  base_url: string;
}

export interface CreateChatbotReplyData {
  id: string;
  session_id: string;
  message: string;
}

// Request Interfaces
export interface ListKnowledgeItemsParams extends AuthenticationParams {
  cursor?: string;
  limit?: number;
}

export type ListChatBotsParams = AuthenticationParams;

export interface AddVideoParams extends AuthenticationParams {
  video_type: 'YOUTUBE';
  video_url: string;
}

export interface CreateFaqParams extends AuthenticationParams {
  title: string;
  description?: string;
}

export interface StartTrainingParams extends AuthenticationParams {
  id: string;
}

export interface AddFaqItemParams extends AuthenticationParams {
  faq_id: string;
  question: string;
  answer: string;
  source_url?: string;
  categories?: string[];
}

export interface AddWebsiteParams extends AuthenticationParams {
  website_url: string;
}

export interface CreateChatbotReplyParams extends AuthenticationParams {
  chatbot_id: string;
  message: string;
  session_id?: string;
}

// Response Interfaces
interface ListAPIResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    has_more: boolean;
    next_cursor: string;
  };
  message?: string;
}
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type ListKnowledgeItemsResponse = ListAPIResponse<KnowledgeItem>;

export type ListChatBotsResponse = ListAPIResponse<ChatbotData>;

export type AddVideoResponse = ApiResponse<AddVideoData>;

export type CreateFaqResponse = ApiResponse<CreateFaqData>;

export type StartTrainingResponse = ApiResponse<KnowledgeItem>;

export type AddFaqItemResponse = ApiResponse<AddFaqItemData>;

export type AddWebsiteResponse = ApiResponse<AddWebsiteData>;

export type CreateChatbotReplyResponse = ApiResponse<CreateChatbotReplyData>;
