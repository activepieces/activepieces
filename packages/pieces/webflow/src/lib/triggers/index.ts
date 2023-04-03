import { webflowRegisterTrigger } from "./register";

export const webflowTriggers = [
  {
    name: 'form_submission',
    event: 'form_submission',
    description: 'Sends the form_submission event',
    displayName: 'Form Submission'
  },
  {
    name: 'site_publish',
    event: 'site_publish',
    description: 'Sends a site_publish event',
    displayName: 'Site Publish'
  },
  {
    name: 'ecomm_new_order',
    event: 'ecomm_new_order',
    description: 'Sends the new ecomm_new_order event',
    displayName: 'E-Commerce New Order'
  },
  {
    name: 'memberships_user_account_added',
    event: 'memberships_user_account_added',
    description: 'Sends the memberships_user_account_added event',
    displayName: 'User Account Added'
  } 
].map(trigger => webflowRegisterTrigger(trigger))