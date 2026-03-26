import { everhour } from './dist/index.js';

console.log('Piece name:', everhour.displayName);
console.log('Auth type:', everhour.auth?.type);
console.log('Actions count:', everhour.actions?.length);


if (everhour.actions && Array.isArray(everhour.actions)) {
  everhour.actions.forEach((action: any) => {
    console.log('- ' + action.name);
  });
}