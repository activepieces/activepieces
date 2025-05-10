export const PCLOUD_API_URL = 'https://api.pcloud.com';

export const API_ENDPOINTS = {
  // Auth Operations
  SEND_VERIFICATION_EMAIL: '/sendverificationemail',
  VERIFY_EMAIL: '/verifyemail',
  CHANGE_PASSWORD: '/changepassword',
  LOST_PASSWORD: '/lostpassword',
  RESET_PASSWORD: '/resetpassword',
  REGISTER: '/register',
  INVITE: '/invite',
  USER_INVITES: '/userinvites',
  LOGOUT: '/logout',
  LIST_TOKENS: '/listtokens',
  DELETE_TOKEN: '/deletetoken',
  SEND_CHANGE_EMAIL: '/sendchangemail',
  CHANGE_EMAIL: '/changemail',
  SEND_DEACTIVATE_EMAIL: '/senddeactivatemail',
  DEACTIVATE_USER: '/deactivateuser',

  // File Operations
  UPLOAD_FILE: '/uploadfile',
  DOWNLOAD_FILE: '/downloadfile',
  COPY_FILE: '/copyfile',
  DELETE_FILE: '/deletefile',
  RENAME_FILE: '/renamefile',
  STAT_FILE: '/stat',

  // Folder Operations
  CREATE_FOLDER: '/createfolder',
  LIST_FOLDER: '/listfolder',
  RENAME_FOLDER: '/renamefolder',
  DELETE_FOLDER: '/deletefolder',
  COPY_FOLDER: '/copyfolder',

  // Public Links
  GET_FILE_PUBLINK: '/getfilepublink',
  GET_FOLDER_PUBLINK: '/getfolderpublink',
  DELETE_PUBLINK: '/deletepublink',
  CHANGE_PUBLINK: '/changepublink',

  // Thumbnails
  GET_THUMB: '/getthumb',
  GET_THUMB_LINK: '/getthumblink',

  // User Operations
  USER_INFO: '/userinfo',

  // Sharing
  SHARE_FOLDER: '/sharefolder',
  LIST_SHARES: '/listshares',
  REMOVE_SHARE: '/removeshare',
  CHANGE_SHARE: '/changeshare'
};

export const WEBHOOK_EVENTS = {
  FILE_CREATED: 'FILE_CREATED',
  FILE_UPDATED: 'FILE_UPDATED',
  FILE_DELETED: 'FILE_DELETED',
  FOLDER_CREATED: 'FOLDER_CREATED',
  FOLDER_DELETED: 'FOLDER_DELETED',
  SHARE_CREATED: 'SHARE_CREATED',
  SHARE_DELETED: 'SHARE_DELETED'
};
