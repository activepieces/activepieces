export type TrelloCard = {
  id: string;
  address: string;
  badges: {
    attachmentsByType: {
      trello: {
        board: number;
        card: number;
      };
    };
    location: boolean;
    votes: number;
    viewingMemberVoted: boolean;
    subscribed: boolean;
    fogbugz: string;
    checkItems: number;
    checkItemsChecked: number;
    comments: number;
    attachments: number;
    description: boolean;
    due: string;
    start: string;
    dueComplete: boolean;
  };
  checkItemStates: string[];
  closed: boolean;
  coordinates: string;
  creationMethod: string;
  dateLastActivity: string;
  desc: string;
  due: string;
  dueReminder: string;
  email: string;
  idBoard: string;
  idChecklists: { id: string }[];
  idLabels: {
    id: string;
    idBoard: string;
    name: string;
    color: string;
  }[];
  idList: string;
  idMembers: string[];
  idMembersVoted: string[];
  idShort: number;
  labels: string[];
  locationName: string;
  manualCoverAttachment: boolean;
  name: string;
  pos: number;
  shortLink: string;
  shortUrl: string;
  subscribed: boolean;
  url: string;
};
export type TrelloCardMoved = {
  action: {
    display: {
      translationKey: string;
      entities: {
        card: {
          type: string;
          idList: string;
          id: string;
          shortLink: string;
          text: string;
        };
        listBefore: {
          type: string;
          id: string;
          text: string;
        };
        listAfter: {
          type: string;
          id: string;
          text: string;
        };
        memberCreator: {
          type: string;
          id: string;
          username: string;
          text: string;
        };
      };
    };
  };
};
export type TrelloNewCard = {
  action: {
    display: {
      translationKey: string;
      entities: {
        card: {
          type: string;
          id: string;
          shortLink: string;
          text: string;
        };
        list: {
          type: string;
          id: string;
          text: string;
        };
        memberCreator: {
          type: string;
          id: string;
          username: string;
          text: string;
        };
      };
    };
  };
};
