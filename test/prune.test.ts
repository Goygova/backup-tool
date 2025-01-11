import * as fs from 'fs-extra';
import * as path from 'path';
import { pruneSnapshot } from '../src/prune';
import { updateHashMap } from '../src/utils';

jest.mock('fs-extra');
jest.mock('path');
jest.mock('../src/utils');

describe('pruneSnapshot', () => {
  const snapshotDir = '/mock/snapshot/dir';
  const snapshotIdToRemove = 'snapshot1';
  const snapshotFilePath = `${snapshotDir}/${snapshotIdToRemove}.json`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove the snapshot file and update the hash map', async () => {
    const mockSnapshotContent = JSON.stringify({
      files: {
        'file1.txt': { hash: 'hash1', content: 'content1' },
        'file2.txt': { hash: 'hash2', content: 'content2' },
      },
    });

    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockSnapshotContent);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    await pruneSnapshot(snapshotDir, snapshotIdToRemove);

    expect(fs.promises.access).toHaveBeenCalledWith(snapshotDir);
    expect(fs.pathExists).toHaveBeenCalledWith(snapshotFilePath);
    expect(fs.promises.readFile).toHaveBeenCalledWith(snapshotFilePath, 'utf-8');
    expect(fs.promises.unlink).toHaveBeenCalledWith(snapshotFilePath);
    expect(updateHashMap).toHaveBeenCalledWith(['hash1', 'hash2']);
  });

  it('should log an error if the snapshot directory is inaccessible', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (fs.promises.access as jest.Mock).mockRejectedValue(new Error('Access denied'));

    await pruneSnapshot(snapshotDir, snapshotIdToRemove);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred while pruning snapshot: Access denied');
    consoleErrorSpy.mockRestore();
  });

  it('should log an error if the snapshot file does not exist', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (fs.pathExists as jest.Mock).mockResolvedValue(false);

    await pruneSnapshot(snapshotDir, snapshotIdToRemove);

    expect(consoleErrorSpy).toHaveBeenCalledWith(`Snapshot with ID "${snapshotIdToRemove}" not found.`);
    consoleErrorSpy.mockRestore();
  });
});