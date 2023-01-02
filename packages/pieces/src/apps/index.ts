import type {Piece} from '../framework/piece';
import { gmail } from './gmail';
import {slack} from "./slack";
import {github} from "./github";
import { discord } from './discord';

export const pieces: Piece[] = [
	slack,
	gmail,
	github
];

export const getPiece = (name: string): Piece | undefined => {
	return pieces.find(f => name.toLowerCase() === f.name.toLowerCase());
}