import type {Piece} from '../framework/piece';
import { gmail } from './gmail';
import { facebook } from './facebook';
import {slack} from "./slack";
import {github} from "./github";

export const pieces: Piece[] = [
	slack,
	gmail,
	facebook,
	github
];

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find(f => name.toLowerCase() === f.name.toLowerCase());
}