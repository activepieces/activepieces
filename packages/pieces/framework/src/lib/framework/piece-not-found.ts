export class PieceNotFound extends Error {
	constructor(
		public readonly pieceName: string
	) {
		super(`error= piece=${pieceName}`);
	}
}
