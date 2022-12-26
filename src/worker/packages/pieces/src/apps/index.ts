import type {Piece} from '../framework/piece';
import { gmail } from './gmail';
import { facebook } from './facebook';
import {slack} from "./slack";

export const pieces: Piece[] = [
	slack,
	gmail,
	facebook
];

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find(f => name.toLowerCase() === f.name.toLowerCase());
}