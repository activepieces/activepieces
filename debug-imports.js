// Debug script to find undefined imports
const fs = require('fs');
const path = require('path');

console.log('Checking Mailchimp imports...');

// Check if all action files exist
const actionFiles = [
  'add-member-to-list',
  'add-note-to-subscriber', 
  'remove-subscriber-from-tag',
  'update-subscriber-status',
  'add-subscriber-to-tag',
  'create-campaign',
  'get-campaign-report',
  'create-audience',
  'add-or-update-subscriber',
  'create-list',
  'archive-subscriber',
  'unsubscribe-email',
  'find-campaign',
  'find-customer',
  'find-tag',
  'find-subscriber'
];

const triggerFiles = [
  'subscribe-trigger',
  'unsubscribe-trigger',
  'new-campaign-trigger',
  'link-clicked-trigger',
  'new-customer-trigger',
  'new-order-trigger',
  'new-segment-tag-subscriber-trigger',
  'new-or-updated-subscriber-trigger',
  'email-opened-trigger'
];

const basePath = 'packages/pieces/community/mailchimp/src/lib';

console.log('\n=== CHECKING ACTION FILES ===');
actionFiles.forEach(file => {
  const filePath = path.join(basePath, 'actions', `${file}.ts`);
  const exists = fs.existsSync(filePath);
  console.log(`${file}: ${exists ? '✅' : '❌ MISSING'}`);
});

console.log('\n=== CHECKING TRIGGER FILES ===');
triggerFiles.forEach(file => {
  const filePath = path.join(basePath, 'triggers', `${file}.ts`);
  const exists = fs.existsSync(filePath);
  console.log(`${file}: ${exists ? '✅' : '❌ MISSING'}`);
});
