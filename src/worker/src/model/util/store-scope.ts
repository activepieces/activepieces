export class StoreScope {
  private readonly _path: string[];

  constructor(_path: string[]) {
    this._path = _path;
  }

  public remoteFlow(
    collectionVersionId: string,
    flowVersionID: string
  ): StoreScope {
    const path = JSON.parse(JSON.stringify(this._path));
    path.push('collectionVersion');
    path.push(collectionVersionId);
    path.push('flowVersion');
    path.push(flowVersionID);
    return new StoreScope(path);
  }

  public key(key: string): string[] {
    const path = JSON.parse(JSON.stringify(this._path));
    path.push(key);
    return path;
  }
}
