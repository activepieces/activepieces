export * from './Product';
export * from './Brand';
export * from './Category';
export * from './SKU';

export type Replace<T, R> = Omit<T, keyof R> & R;
