import { getFileHash, formatTimestamp, saveHashMap, loadHashMap, formatSize, updateHashMap } from '../src/utils';
import * as fs from 'fs-extra';
import * as path from 'path';

jest.mock('fs-extra');


describe('utils.ts', () => {
  describe('getFileHash', () => {
    it('should return the correct hash for a given file content', () => {
      const fileContent = Buffer.from('test content');
      const expectedHash = '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72';
      const hash = getFileHash(fileContent);
      expect(hash).toBe(expectedHash);
    });
  });

  describe('formatTimestamp', () => {
    it('should format the date correctly', () => {
      const date = new Date('2023-10-05T14:48:00.000Z');
      const formattedDate = formatTimestamp(date);
      expect(formattedDate).toBe('2023-10-05 07:48:00');
    });
  });

  describe('saveHashMap', () => {
    it('should save the hash map to the correct file', () => {
      const hashMap = { 'file1': 'hash1', 'file2': 'hash2' };
      const hashMapFilePath = path.join(__dirname, '../storage/hashMap.json');
      saveHashMap(hashMap);
      expect(fs.writeFileSync).toHaveBeenCalledWith(hashMapFilePath, JSON.stringify(hashMap, null, 2));
    });
  });

  describe('loadHashMap', () => {
    it('should load the hash map from the file if it exists', () => {
      const hashMap = { 'file1': 'hash1', 'file2': 'hash2' };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(hashMap));
      const loadedHashMap = loadHashMap();
      expect(loadedHashMap).toEqual(hashMap);
    });

    it('should return an empty object if the file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const loadedHashMap = loadHashMap();
      expect(loadedHashMap).toEqual({});
    });

    it('should return an empty object if the file is empty', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      const loadedHashMap = loadHashMap();
      expect(loadedHashMap).toEqual({});
    });

    it('should return an empty object if JSON parsing fails', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
      console.error = jest.fn();
      const loadedHashMap = loadHashMap();
      expect(loadedHashMap).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('formatSize', () => {
    it('should format the size correctly', () => {
      expect(formatSize(100)).toBe('100 B');
      expect(formatSize(1024)).toBe('1.00 KB');
      expect(formatSize(1024 ** 2)).toBe('1.00 MB');
      expect(formatSize(1024 ** 3)).toBe('1.00 GB');
    });
  });
});