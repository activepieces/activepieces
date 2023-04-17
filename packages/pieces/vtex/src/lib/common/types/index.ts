export * from "./Product";
export * from "./Brand";
export * from "./Category";

export type Replace<T, R> = Omit<T, keyof R> & R;


