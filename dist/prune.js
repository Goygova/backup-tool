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
exports.pruneSnapshots = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const pruneSnapshots = (snapshotDir, snapshotIdsToRemove) => {
    if (!fs.existsSync(snapshotDir)) {
        console.error(`Error: Directory "${snapshotDir}" does not exist.`);
        return;
    }
    console.log(`Pruning snapshots ${snapshotIdsToRemove}`);
    const snapshotFiles = fs.readdirSync(snapshotDir).filter(file => file.endsWith('.json'));
    if (snapshotFiles.length === 0) {
        console.error(`Error: No snapshot files found in directory "${snapshotDir}".`);
        return;
    }
    const snapshots = snapshotFiles.map(file => {
        const filePath = path.join(snapshotDir, file);
        return {
            id: path.basename(file, '.json'),
            data: JSON.parse(fs.readFileSync(filePath, 'utf-8')),
        };
    });
    // Validate input IDs
    const invalidIds = snapshotIdsToRemove.filter(id => !snapshots.some(snapshot => snapshot.id === id));
    if (invalidIds.length > 0) {
        console.error(`Error: The following snapshot IDs are invalid or not found: ${invalidIds.join(', ')}`);
        return;
    }
    // Remove snapshot files for the specified IDs
    snapshotIdsToRemove.forEach(id => {
        const snapshotFile = path.join(snapshotDir, `${id}.json`);
        fs.unlinkSync(snapshotFile);
        console.log(`Deleted snapshot: ${id}`);
    });
    console.log(`Successfully pruned ${snapshotIdsToRemove.length} snapshot(s).`);
};
exports.pruneSnapshots = pruneSnapshots;
