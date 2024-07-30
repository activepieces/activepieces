import os from 'os';

export async function initializeAndDownloadBudget(api: any, auth: any) {
    await api.init({
      // Budget data will be cached locally here, in subdirectories for each file.
      dataDir: os.tmpdir(),
      serverURL: auth.server_url,
      password: auth.password,
    });
  
    await api.downloadBudget(auth.sync_id, { password: auth.encryption_password ?? undefined });
}