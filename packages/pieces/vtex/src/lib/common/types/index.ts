export * from "./Product";

export type Replace<T, R> = Omit<T, keyof R> & R;


