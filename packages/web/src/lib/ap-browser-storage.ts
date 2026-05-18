export class ApStorage {
  private static instance: Storage;
  private constructor(value: Storage) {
    ApStorage.instance = value;
  }
  static getInstance() {
    if (!ApStorage.instance) {
      ApStorage.instance = window.localStorage;
    }
    return ApStorage.instance;
  }
  static setInstanceToSessionStorage() {
    ApStorage.instance = window.sessionStorage;
  }
}
