import * as fs from 'fs-extra';
import * as path from 'path';
import { restoreSnapshot } from '../src/restore';
import { loadHashMap } from '../src/utils';
import { Snapshot } from '../src/snapshots';

jest.mock('fs-extra');
jest.mock('path');
jest.mock('../src/utils');

describe('restoreSnapshot', () => {
  const snapshotId = 'test-snapshot';
  const snapshotsDir = '/snapshots';
  const outputDir = '/output';
  const snapshotFilePath = `${snapshotsDir}/${snapshotId}.json`;
  const hashMap = { 'hash1': 'file content' };
  const snapshot: Snapshot = {
    id: snapshotId,
    files: {
      'file1.txt': { hash: 'hash1' , content: 'file content' },
    },
    timestamp: new Date('2025-01-10T15:30:00Z'),
    snapshotSize: 0,
    directorySize: 0,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (loadHashMap as jest.Mock).mockReturnValue(hashMap);
  });

  it('should throw an error if snapshots directory is not accessible', async () => {
    (fs.promises.access as jest.Mock).mockRejectedValueOnce(new Error('Access denied'));

    await expect(restoreSnapshot(snapshotId, snapshotsDir, outputDir)).rejects.toThrow(
      `Error accessing directory "${snapshotsDir}": Access denied`
    );
  });

  it('should throw an error if snapshot file is not found', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.access as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    console.error = jest.fn();

    await expect(restoreSnapshot(snapshotId, snapshotsDir, outputDir)).rejects.toThrow(
      `Snapshot file not found: ${snapshotFilePath}`
    );
  });

  it('should throw an error if reading snapshot file fails', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(new Error('Read error'));

    await expect(restoreSnapshot(snapshotId, snapshotsDir, outputDir)).rejects.toThrow('Read error');
  });

  it('should restore files from the snapshot', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(snapshot));
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    await restoreSnapshot(snapshotId, snapshotsDir, outputDir);

    expect(fs.promises.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
    expect(fs.promises.mkdir).toHaveBeenCalledWith(path.dirname(`${outputDir}/file1.txt`), { recursive: true });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(`${outputDir}/file1.txt`, 'file content');
  });

  it('should warn if file content for hash is not found in hash map', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.access as jest.Mock).mockResolvedValueOnce(undefined);
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify({
      id: snapshotId,
      files: {
        'file2.txt': { hash: 'hash2' },
      },
    }));
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);

    await restoreSnapshot(snapshotId, snapshotsDir, outputDir);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Content for hash "hash2" not found in hash map. Skipping file: file2.txt`
    );

    consoleWarnSpy.mockRestore();
  });
});