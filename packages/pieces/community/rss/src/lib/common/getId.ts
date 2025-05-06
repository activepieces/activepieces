// Some RSS feeds use the id field, some use the guid field, and some use neither.
export function getId(item: { id: string; guid: string }) {
    if (item === undefined) {
      return undefined;
    }
    if (item.guid) {
      return item.guid;
    }
    if (item.id) {
      return item.id;
    }
    return JSON.stringify(item);
  }
  