export enum Product {
  OPEN = 'open',
  FREE = 'free',
  PREMIUM = 'premium',
}

export interface User {
  id: string;
  email?: string;
  display_name: string;
  product: Product;
  type: 'user';
  uri: string;
}
