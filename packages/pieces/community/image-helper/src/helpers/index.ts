import fs from 'fs';

export function is_exiftool_installed(): boolean {
  const exiftoolPath = '/usr/bin/exiftool';
  return fs.existsSync(exiftoolPath);
}
