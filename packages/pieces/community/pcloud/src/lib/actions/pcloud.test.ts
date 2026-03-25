import { pcloudListFolder } from './list-folder';
import { pcloudUploadFile } from './upload-file';
import { pcloudDownloadFile } from './download-file';
import { pcloudCreateFolder } from './create-folder';
import { pcloudCopyFile } from './copy-file';
import { pcloudFindFile } from './find-file';
import { pcloudFindFolder } from './find-folder';
import { pcloudNewFile } from '../triggers/new-file';
import { pcloudNewFolder } from '../triggers/new-folder';

describe('pCloud Actions', () => {
  describe('pcloudListFolder', () => {
    it('should have correct action properties', () => {
      expect(pcloudListFolder.name).toBe('list_pcloud_folder');
      expect(pcloudListFolder.displayName).toBe('List Folder');
      expect(pcloudListFolder.description).toBe('List the contents of a folder');
      expect(pcloudListFolder.auth).toBeDefined();
    });

    it('should have required props defined', () => {
      expect(pcloudListFolder.props.folderId).toBeDefined();
      expect(pcloudListFolder.props.recursive).toBeDefined();
    });

    it('should have correct default values for props', () => {
      const folderIdProp = pcloudListFolder.props.folderId;
      const recursiveProp = pcloudListFolder.props.recursive;

      expect(folderIdProp.defaultValue).toBe(0);
      expect(recursiveProp.defaultValue).toBe(false);
    });

    it('should have folderId as required prop', () => {
      const folderIdProp = pcloudListFolder.props.folderId;
      expect(folderIdProp.required).toBe(true);
    });
  });

  describe('pcloudUploadFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudUploadFile.name).toBe('upload_pcloud_file');
      expect(pcloudUploadFile.displayName).toBe('Upload File');
      expect(pcloudUploadFile.description).toBe('Upload a file to pCloud');
    });

    it('should have required props defined', () => {
      expect(pcloudUploadFile.props.folderId).toBeDefined();
      expect(pcloudUploadFile.props.file).toBeDefined();
      expect(pcloudUploadFile.props.fileName).toBeDefined();
      expect(pcloudUploadFile.props.overwrite).toBeDefined();
    });

    it('should mark file and fileName as required', () => {
      expect(pcloudUploadFile.props.file.required).toBe(true);
      expect(pcloudUploadFile.props.fileName.required).toBe(true);
    });
  });

  describe('pcloudDownloadFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudDownloadFile.name).toBe('download_pcloud_file');
      expect(pcloudDownloadFile.displayName).toBe('Download File');
      expect(pcloudDownloadFile.description).toBe('Download a file from pCloud');
    });

    it('should have fileId as required prop', () => {
      expect(pcloudDownloadFile.props.fileId).toBeDefined();
      expect(pcloudDownloadFile.props.fileId.required).toBe(true);
    });
  });

  describe('pcloudCreateFolder', () => {
    it('should have correct action properties', () => {
      expect(pcloudCreateFolder.name).toBe('create_pcloud_folder');
      expect(pcloudCreateFolder.displayName).toBe('Create Folder');
      expect(pcloudCreateFolder.description).toBe('Create a new folder');
    });

    it('should have required props defined', () => {
      expect(pcloudCreateFolder.props.folderId).toBeDefined();
      expect(pcloudCreateFolder.props.name).toBeDefined();
      expect(pcloudCreateFolder.props.name.required).toBe(true);
    });

    it('should have correct default values for props', () => {
      const folderIdProp = pcloudCreateFolder.props.folderId;
      expect(folderIdProp.defaultValue).toBe(0);
    });
  });

  describe('pcloudCopyFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudCopyFile.name).toBe('copy_pcloud_file');
      expect(pcloudCopyFile.displayName).toBe('Copy File');
      expect(pcloudCopyFile.description).toBe('Copy a file to another folder in pCloud');
    });

    it('should have required props defined', () => {
      expect(pcloudCopyFile.props.fileId).toBeDefined();
      expect(pcloudCopyFile.props.toFolderId).toBeDefined();
    });

    it('should have overwrite as optional with correct default', () => {
      expect(pcloudCopyFile.props.overwrite).toBeDefined();
      expect(pcloudCopyFile.props.overwrite.required).toBe(false);
      expect(pcloudCopyFile.props.overwrite.defaultValue).toBe(false);
    });
  });

  describe('pcloudFindFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudFindFile.name).toBe('find_pcloud_file');
      expect(pcloudFindFile.displayName).toBe('Find File');
      expect(pcloudFindFile.description).toBe('Search for files by name in pCloud');
    });

    it('should have query as required prop', () => {
      expect(pcloudFindFile.props.query).toBeDefined();
      expect(pcloudFindFile.props.query.required).toBe(true);
    });

    it('should have folderId as optional with correct default', () => {
      expect(pcloudFindFile.props.folderId).toBeDefined();
      expect(pcloudFindFile.props.folderId.required).toBe(false);
      expect(pcloudFindFile.props.folderId.defaultValue).toBe(0);
    });
  });

  describe('pcloudFindFolder', () => {
    it('should have correct action properties', () => {
      expect(pcloudFindFolder.name).toBe('find_pcloud_folder');
      expect(pcloudFindFolder.displayName).toBe('Find Folder');
      expect(pcloudFindFolder.description).toBe('Search for folders by name in pCloud');
    });

    it('should have query as required prop', () => {
      expect(pcloudFindFolder.props.query).toBeDefined();
      expect(pcloudFindFolder.props.query.required).toBe(true);
    });

    it('should have parentFolderId as optional with correct default', () => {
      expect(pcloudFindFolder.props.parentFolderId).toBeDefined();
      expect(pcloudFindFolder.props.parentFolderId.required).toBe(false);
      expect(pcloudFindFolder.props.parentFolderId.defaultValue).toBe(0);
    });
  });
});

describe('pCloud Triggers', () => {
  describe('pcloudNewFile', () => {
    it('should have correct trigger properties', () => {
      expect(pcloudNewFile.name).toBe('new_file_uploaded');
      expect(pcloudNewFile.displayName).toBe('New File Uploaded');
      expect(pcloudNewFile.description).toBe('Triggers when a new file is uploaded to a folder');
    });

    it('should have polling strategy', () => {
      expect(pcloudNewFile.type).toBeDefined();
      expect(pcloudNewFile.run).toBeDefined();
      expect(pcloudNewFile.test).toBeDefined();
      expect(pcloudNewFile.onEnable).toBeDefined();
      expect(pcloudNewFile.onDisable).toBeDefined();
    });

    it('should have folderId as optional with correct default', () => {
      expect(pcloudNewFile.props.folderId).toBeDefined();
      expect(pcloudNewFile.props.folderId.required).toBe(false);
      expect(pcloudNewFile.props.folderId.defaultValue).toBe(0);
    });

    it('should have valid sample data', () => {
      expect(pcloudNewFile.sampleData).toBeDefined();
      expect(pcloudNewFile.sampleData.name).toBe('example.pdf');
      expect(pcloudNewFile.sampleData.fileid).toBeDefined();
      expect(pcloudNewFile.sampleData.isfolder).toBe(false);
    });
  });

  describe('pcloudNewFolder', () => {
    it('should have correct trigger properties', () => {
      expect(pcloudNewFolder.name).toBe('new_folder_created');
      expect(pcloudNewFolder.displayName).toBe('Folder Created');
      expect(pcloudNewFolder.description).toBe('Triggers when a new folder is created');
    });

    it('should have polling strategy', () => {
      expect(pcloudNewFolder.type).toBeDefined();
      expect(pcloudNewFolder.run).toBeDefined();
      expect(pcloudNewFolder.test).toBeDefined();
      expect(pcloudNewFolder.onEnable).toBeDefined();
      expect(pcloudNewFolder.onDisable).toBeDefined();
    });

    it('should have parentFolderId as optional with correct default', () => {
      expect(pcloudNewFolder.props.parentFolderId).toBeDefined();
      expect(pcloudNewFolder.props.parentFolderId.required).toBe(false);
      expect(pcloudNewFolder.props.parentFolderId.defaultValue).toBe(0);
    });

    it('should have valid sample data', () => {
      expect(pcloudNewFolder.sampleData).toBeDefined();
      expect(pcloudNewFolder.sampleData.name).toBe('New Project');
      expect(pcloudNewFolder.sampleData.isfolder).toBe(true);
    });
  });
});
