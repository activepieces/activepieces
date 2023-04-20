import { webflowRegisterTrigger } from "./register";

export const webflowTriggers = [
  {
    name: 'form_submission',
    event: 'form_submission',
    description: 'Sends the form_submission event',
    displayName: 'Form Submission',
    sampleData: {
      "name": "Sample Form",
      "site": "62749158efef318abc8d5a0f",
      "data": {
        "name": "Some One",
        "email": "some.one@home.com"
      },
      "d": "2022-09-14T12:35:16.117Z",
      "_id": "6321ca84df3949bfc6752327"
    }
  }
].map(trigger => webflowRegisterTrigger(trigger))