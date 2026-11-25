import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class PlatformPiecesPage extends BasePage {
  url = '/platform/pieces';

  async open({ search }: { search: string }): Promise<void> {
    const listed = this.page.waitForResponse(isPiecesList);
    await this.page.goto(`${this.url}?${new URLSearchParams({ name: search })}`);
    expect((await listed).status(), 'Listing the pieces failed').toBe(200);
  }

  async installArchive(archive: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.page.getByRole('button', { name: 'Install Piece', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Install a piece' });
    await dialog.getByTestId('install-piece-package-type').click();
    const archiveOption = this.page.getByRole('option', { name: 'Packed Archive (.tgz)', exact: true });
    await expect(archiveOption, 'A plan without managePiecesEnabled cannot install an archive').toBeEnabled();
    await archiveOption.click();
    await dialog.getByTestId('install-piece-archive').setInputFiles(archive);
    const installed = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === PIECES_PATH, { timeout: INSTALL_TIMEOUT_MS });
    await dialog.getByRole('button', { name: 'Install', exact: true }).click();
    const response = await installed;
    expect(response.status(), `Installing the archive failed: ${await response.text()}`).toBe(201);
    await expect(dialog).toBeHidden();
  }

  pieceRow(pieceName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: pieceName, exact: true }) });
  }

  async openPieceSets(): Promise<void> {
    const listed = this.page.waitForResponse(isPieceSetsList, { timeout: LIVE_LIST_TIMEOUT_MS }).catch(() => {
      throw new Error(`The page sent no piece sets request in ${LIVE_LIST_TIMEOUT_MS} ms: a plan without managePiecesEnabled does not list piece sets`);
    });
    await this.page.goto(PIECE_SETS_URL);
    expect((await listed).status(), 'Listing the piece sets failed').toBe(200);
  }

  async createPieceSet(name: string): Promise<{ id: string; name: string }> {
    await this.page.getByRole('button', { name: 'New Piece Set', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Create Piece Set' });
    await dialog.getByTestId('piece-set-name-input').fill(name);
    const created = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === PIECE_SETS_PATH);
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    const response = await created;
    expect(response.status(), `Creating the piece set failed: ${await response.text()}`).toBe(201);
    await expect(dialog).toBeHidden();
    return response.json();
  }

  async openPieceSet({ id, displayName = '' }: { id: string; displayName?: string }): Promise<void> {
    const loaded = this.page.waitForResponse((response) => response.request().method() === 'GET' && new URL(response.url()).pathname === `${PIECE_SETS_PATH}/${id}`);
    await this.page.goto(`${PIECE_SETS_URL}/${id}?${new URLSearchParams({ displayName })}`);
    expect((await loaded).status(), 'Reading the piece set failed').toBe(200);
  }

  async togglePiece(pieceName: string): Promise<SavedPieceSet> {
    return this.saveAfter(() => this.pieceToggle(pieceName).click());
  }

  async toggleIncludeNewPieces(): Promise<SavedPieceSet> {
    return this.saveAfter(() => this.includeNewPiecesToggle().click());
  }

  async excludeAllPieces(): Promise<SavedPieceSet> {
    await this.page.getByTestId('data-table-select-all').click();
    return this.saveAfter(() => this.page.getByRole('button', { name: 'Exclude', exact: true }).click());
  }

  async assignProject(projectName: string): Promise<void> {
    await this.page.getByTestId('piece-set-projects-button').click();
    const dialog = this.page.getByRole('dialog', { name: 'Assigned projects' });
    await dialog.getByRole('option', { name: projectName }).click();
    const assigned = this.page.waitForResponse((response) => response.request().method() === 'POST' && ASSIGN_PATH.test(new URL(response.url()).pathname));
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await assigned;
    expect(response.status(), `Assigning the project failed: ${await response.text()}`).toBe(204);
    await expect(dialog).toBeHidden();
  }

  pieceToggle(pieceName: string): Locator {
    return this.pieceRow(pieceName).getByTestId('piece-set-piece-toggle');
  }

  includeNewPiecesToggle(): Locator {
    return this.page.getByTestId('piece-set-include-new-pieces');
  }

  private async saveAfter(action: () => Promise<void>): Promise<SavedPieceSet> {
    const saved = this.page.waitForResponse((response) => response.request().method() === 'POST' && PIECE_SET_PATH.test(new URL(response.url()).pathname));
    await action();
    const response = await saved;
    expect(response.status(), `Saving the piece set failed: ${await response.text()}`).toBe(200);
    return response.json();
  }
}

function isPiecesList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === PIECES_PATH;
}

function isPieceSetsList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === PIECE_SETS_PATH;
}

const PIECES_PATH = '/api/v1/pieces';
const PIECE_SETS_PATH = '/api/v1/piece-sets';
const PIECE_SET_PATH = /^\/api\/v1\/piece-sets\/[^/]+$/;
const ASSIGN_PATH = /^\/api\/v1\/piece-sets\/[^/]+\/projects$/;
const PIECE_SETS_URL = '/platform/pieces/piece-sets';
const INSTALL_TIMEOUT_MS = 90_000;
const LIVE_LIST_TIMEOUT_MS = 15_000;

type SavedPieceSet = { id: string; config: { pieces: { mode: string; exceptions: string[] } } };
