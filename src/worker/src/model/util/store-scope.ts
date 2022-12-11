export class StoreScope {
  private readonly _path: string[];

  constructor(_path: string[]) {
    this._path = _path;
  }

  public key(key: string): string[] {
    const path = JSON.parse(JSON.stringify(this._path));
    path.push(key);
    return path;
  }
}
