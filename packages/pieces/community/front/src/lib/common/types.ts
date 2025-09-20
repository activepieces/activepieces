export interface FrontLink {
  id: string;
  name: string;
  external_url: string;
}

export interface FrontConversation {
  id: string;
  subject: string;
  last_message: { blurb: string };
}

export interface FrontAccount {
  id: string;
  name: string;
}

export interface FrontChannel {
  id: string;
  name: string;
  address: string;
}

export interface FrontTeammate {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface FrontTag {
  id: string;
  name: string;
}

export interface FrontContactHandle {
  source: string;
  handle: string;
}

export interface FrontContact {
  id: string;
  name: string;
  handles: FrontContactHandle[];
}
