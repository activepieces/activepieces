export type SynkraChatContact = {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
};

export type SynkraChatConversation = {
  id: number;
  inbox_id: number;
  status: string;
  assignee_id?: number;
  team_id?: number;
};

export type SynkraChatMessage = {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  private: boolean;
  created_at: string;
};
