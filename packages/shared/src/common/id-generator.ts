import { customAlphabet } from "nanoid";

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export type ApId = string;

export const apId = customAlphabet(alphabet, 21);