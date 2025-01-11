import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createSnapshot, saveSnapshot, Snapshot } from '../src/snapshots';
import { formatTimestamp, getFileHash, loadHashMap, saveHashMap } from '../src/utils';

jest.mock('fs-extra');
jest.mock('path');
jest.mock('uuid');
jest.mock('../src/utils');

describe('createSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a snapshot with changes', async () => {
    const mockDir = '/mock/dir';
    const mockFiles = ['file1.txt', 'file2.txt'];
    const mockFileContent = 'file content';
    const mockFileHash = 'mockHash';
    const mockHashMap = {};

    (fs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false, isFile: () => true, size: 100 });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);
    (getFileHash as jest.Mock).mockReturnValue(mockFileHash);
    (loadHashMap as jest.Mock).mockReturnValue(mockHashMap);
    (uuidv4 as jest.Mock).mockReturnValue('mockUUID');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    const snapshot = await createSnapshot(mockDir);

    expect(snapshot).toEqual({
      id: 'mockUUID',
      timestamp: expect.any(Date),
      files: {
        '/mock/dir/file1.txt': { hash: mockFileHash, content: mockFileContent },
        '/mock/dir/file2.txt': { hash: mockFileHash, content: mockFileContent },
      },
      snapshotSize: 200,
      directorySize: 200,
    });
  });

  it('should return null if no changes are detected', async () => {
    const mockDir = '/mock/dir';
    const mockFiles = ['file1.txt'];
    const mockFileContent = 'file content';
    const mockFileHash = 'mockHash';
    const mockHashMap = { [mockFileHash]: mockFileContent };

    (fs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);
    (fs.promises.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false, isFile: () => true, size: 100 });
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);
    (getFileHash as jest.Mock).mockReturnValue(mockFileHash);
    (loadHashMap as jest.Mock).mockReturnValue(mockHashMap);

    const snapshot = await createSnapshot(mockDir);

    expect(snapshot).toBeNull();
    expect(saveHashMap).not.toHaveBeenCalled();
  });

  it('should throw an error if the directory does not exist', async () => {
    const mockDir = '/mock/dir';

    (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error('Directory not found'));

    await expect(createSnapshot(mockDir)).rejects.toThrow('Directory not found');
  });
});

describe('saveSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a snapshot to a JSON file', async () => {
    const mockSnapshot: Snapshot = {
      id: 'mockUUID',
      timestamp: new Date(),
      files: {
        '/mock/dir/file1.txt': { hash: 'mockHash', content: 'file content' },
      },
      snapshotSize: 100,
      directorySize: 100,
    };
    const mockOutputDir = '/mock/output';
    const mockFormattedTimestamp = '2023-01-01T00:00:00Z';
    const mockHashMap = {};

    (formatTimestamp as jest.Mock).mockReturnValue(mockFormattedTimestamp);
    (loadHashMap as jest.Mock).mockReturnValue(mockHashMap);

    await saveSnapshot(mockSnapshot, mockOutputDir);

    expect(fs.ensureDir).toHaveBeenCalledWith(mockOutputDir);
    expect(fs.writeJson).toHaveBeenCalledWith(
      path.join(mockOutputDir, 'mockUUID.json'),
      { ...mockSnapshot, timestamp: mockFormattedTimestamp },
      { spaces: 2 }
    );
    expect(saveHashMap).toHaveBeenCalledWith({
      mockHash: 'file content',
    });
  });
});