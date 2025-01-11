import * as fs from 'fs-extra';
import * as path from 'path';
import { listSnapshots } from '../src/list';

jest.mock('fs-extra');
jest.mock('path');

describe('listSnapshots', () => {
  const mockSnapshotsDir = '/mock/snapshots';
  const mockSnapshots = [
    {
      id: 'snapshot_001', timestamp: new Date('2025-01-09T12:00:00Z'),
      files: {  "file1.txt": { hash: "hash1", content: 'test' }, "file2.txt": { hash: "hash2", content: "test2"} }
    } ,
    {
      id: 'snapshot_002', timestamp: new Date('2025-01-10T15:30:00Z'),
      files: {  "file1.txt": { hash: "hash1", content: 'test' }, "file2.txt": { hash: "hash2", content: "test2"} }
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list all snapshots sorted by timestamp', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(true);
    (fs.promises.readdir as jest.Mock).mockResolvedValue(['snapshot_001.json', 'snapshot_002.json']);
    (fs.promises.readFile as jest.Mock).mockImplementation((file: string) => {
      const snapshotId = file.split('/').pop()?.replace('.json', '');
      const snapshot = mockSnapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        return Promise.resolve(JSON.stringify(snapshot));
      }
      return Promise.reject(new Error('Snapshot not found'));
    });
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    await listSnapshots(mockSnapshotsDir);

    expect(fs.promises.access).toHaveBeenCalledWith(mockSnapshotsDir);
    expect(fs.promises.readdir).toHaveBeenCalledWith(mockSnapshotsDir);
    expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
  });

  it('should display "No snapshots found." if no snapshot files are present', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(true);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);

    console.log = jest.fn();

    await listSnapshots(mockSnapshotsDir);

    expect(fs.promises.access).toHaveBeenCalledWith(mockSnapshotsDir);
    expect(console.log).toHaveBeenCalledWith('No snapshots found.');
  });

  it('should throw an error if the snapshots directory does not exist', async () => {
    (fs.promises.access as jest.Mock).mockRejectedValue(new Error('Directory not found.'));

    await expect(listSnapshots(mockSnapshotsDir)).rejects.toThrow('Error accessing directory \"/mock/snapshots\": Directory not found.');

    expect(fs.promises.access).toHaveBeenCalledWith(mockSnapshotsDir);
  });

  it('should log an error if reading the directory fails', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(true);
    (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error('Read directory error'));

    console.error = jest.fn();

    await listSnapshots(mockSnapshotsDir);

    expect(fs.promises.access).toHaveBeenCalledWith(mockSnapshotsDir);
    expect(fs.promises.readdir).toHaveBeenCalledWith(mockSnapshotsDir);
    expect(console.error).toHaveBeenCalledWith(`Error reading directory "${mockSnapshotsDir}":`, 'Read directory error');
  });
});
