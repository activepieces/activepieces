import { type ImapFlow, type ListResponse } from 'imapflow';

async function resolveSpecialFolder({
  client,
  role,
}: {
  client: ImapFlow;
  role: SpecialFolderRole;
}): Promise<ResolvedSpecialFolder | null> {
  const folders = await client.list();
  const match = findSpecialFolder({ folders, role });
  if (!match) {
    return null;
  }
  return {
    path: match.path,
    special_use: match.specialUse ?? '',
    special_use_source: match.specialUseSource ?? null,
  };
}

function findSpecialFolder({
  folders,
  role,
}: {
  folders: ListResponse[];
  role: SpecialFolderRole;
}): ListResponse | undefined {
  const selectable = folders.filter((folder) => !folder.flags.has('\\Noselect'));
  if (role === 'archive') {
    return (
      selectable.find((folder) => folder.specialUse === '\\Archive') ??
      selectable.find(
        (folder) =>
          folder.specialUse === '\\All' && folder.specialUseSource === 'extension'
      )
    );
  }
  const flag = role === 'trash' ? '\\Trash' : '\\Drafts';
  return selectable.find((folder) => folder.specialUse === flag);
}

type SpecialFolderRole = 'trash' | 'drafts' | 'archive';

type ResolvedSpecialFolder = {
  path: string;
  special_use: string;
  special_use_source: 'user' | 'extension' | 'name' | null;
};

export {
  type SpecialFolderRole,
  type ResolvedSpecialFolder,
  resolveSpecialFolder,
  findSpecialFolder,
};
