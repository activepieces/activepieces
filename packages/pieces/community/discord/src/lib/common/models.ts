export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface Channel {
  id: string;
  name: string;
}

export interface Member {
  user: {
    id: string;
    username: string;
  };
}

export interface Message {
  id: string;
  type: number;
  content: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
  };
  attachments: any;
  embeds: any;
  mentions: any;
  mention_roles: any;
  pinned: boolean;
  mention_everyone: boolean;
  tts: boolean;
  timestamp: string;
  edited_timestamp: string | null;
  flags: number;
  components: any;
}
