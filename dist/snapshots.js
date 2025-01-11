"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSnapshotById = exports.saveSnapshot = exports.createSnapshot = exports.SNAPSHOT_FILE = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const utils_1 = require("./utils");
exports.SNAPSHOT_FILE = 'snapshots.json';
const createSnapshot = (targetDir) => {
    const snapshotId = (0, uuid_1.v4)();
    const timestamp = new Date();
    const files = {};
    const traverseDirectory = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach((item) => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                console.log(`Traversing directory: ${fullPath}`);
                traverseDirectory(fullPath);
            }
            else if (stat.isFile()) {
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                const fileHash = (0, utils_1.getFileHash)(Buffer.from(fileContent, 'utf-8'));
                files[fullPath] = { hash: fileHash, content: fileContent };
                ;
            }
        });
    };
    traverseDirectory(targetDir);
    return {
        id: snapshotId,
        timestamp,
        files,
    };
};
exports.createSnapshot = createSnapshot;
const saveSnapshot = (snapshot, outputDir) => {
    const fileName = `${snapshot.id}.json`;
    const filePath = path.join(outputDir, fileName);
    fs.ensureDirSync(outputDir);
    const snapshotToSave = {
        ...snapshot,
        timestamp: (0, utils_1.formatTimestamp)(snapshot.timestamp),
    };
    fs.writeJsonSync(filePath, snapshotToSave, { spaces: 2 });
    console.log(`Snapshot saved to: ${filePath}`);
};
exports.saveSnapshot = saveSnapshot;
const loadSnapshotById = (snapshotId, snapshotDirectory) => {
    const snapshotFilePath = path.join(snapshotDirectory, `${snapshotId}.json`);
    if (!fs.existsSync(snapshotFilePath)) {
        console.log(`Snapshot file with id ${snapshotId} not found.`);
        return null;
    }
    try {
        const snapshotData = fs.readJsonSync(snapshotFilePath);
        return snapshotData;
    }
    catch (error) {
        console.error(`Error reading or parsing snapshot file with id ${snapshotId}:`, error);
        return null;
    }
};
exports.loadSnapshotById = loadSnapshotById;
