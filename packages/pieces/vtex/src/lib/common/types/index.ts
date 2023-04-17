export * from "./Product";
export * from "./Brand";

export type Replace<T, R> = Omit<T, keyof R> & R;


