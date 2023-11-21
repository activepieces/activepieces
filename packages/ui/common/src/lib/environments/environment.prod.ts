export const environment = {
  production: true,
  apiUrl: '/api/v1',
  jwtTokenName: 'token',
  redirectUrl: 'http://localhost:8080/redirect',
  userPropertyNameInLocalStorage: 'currentUser',
  // BEGIN EE
  firebase: {
    apiKey: 'AIzaSyBik7RRZ6S8QIpG4GqzwoF_SCNn3Dr9PPw',
    authDomain: 'cloud.activepieces.com',
    projectId: 'activepieces-b3803',
    storageBucket: 'activepieces-b3803.appspot.com',
    messagingSenderId: '89039225374',
    appId: '1:89039225374:web:7e9279293327e02123640f',
  },
  // END EE
};
