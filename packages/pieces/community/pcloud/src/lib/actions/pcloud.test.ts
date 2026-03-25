import { pcloudListFolder } from './list-folder';
import { pcloudUploadFile } from './upload-file';
import { pcloudDownloadFile } from './download-file';
import { pcloudCreateFolder } from './create-folder';
import { pcloudDeleteFile } from './delete-file';
import { pcloudGetFileInfo } from './get-file-info';

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
  });

  describe('pcloudDownloadFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudDownloadFile.name).toBe('download_pcloud_file');
      expect(pcloudDownloadFile.displayName).toBe('Download File');
      expect(pcloudDownloadFile.description).toBe('Download a file from pCloud');
    });

    it('should have required props defined', () => {
      expect(pcloudDownloadFile.props.fileId).toBeDefined();
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
    });

    it('should have correct default values for props', () => {
      const folderIdProp = pcloudCreateFolder.props.folderId;
      expect(folderIdProp.defaultValue).toBe(0);
    });
  });

  describe('pcloudDeleteFile', () => {
    it('should have correct action properties', () => {
      expect(pcloudDeleteFile.name).toBe('delete_pcloud_file');
      expect(pcloudDeleteFile.displayName).toBe('Delete File');
      expect(pcloudDeleteFile.description).toBe('Delete a file');
    });

    it('should have required props defined', () => {
      expect(pcloudDeleteFile.props.fileId).toBeDefined();
    });
  });

  describe('pcloudGetFileInfo', () => {
    it('should have correct action properties', () => {
      expect(pcloudGetFileInfo.name).toBe('get_pcloud_file_info');
      expect(pcloudGetFileInfo.displayName).toBe('Get File Info');
      expect(pcloudGetFileInfo.description).toBe('Get information about a file');
    });

    it('should have required props defined', () => {
      expect(pcloudGetFileInfo.props.fileId).toBeDefined();
    });
  });
});
