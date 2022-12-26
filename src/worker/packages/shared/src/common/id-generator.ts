import { customAlphabet } from "nanoid";

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export type ApId = string;

export const ID_LENGTH = 21;

export const apId = customAlphabet(alphabet, ID_LENGTH);
