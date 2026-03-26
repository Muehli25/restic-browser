import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Program, Location, supportedLocationTypes } from './restic';
import { execSync } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json());

let resticPath = '';
try {
  resticPath = execSync('which restic', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('Could not find restic in PATH automatically. Please ensure restic is installed and available.');
}

const resticProgram = new Program(resticPath);
let currentLocation: Location | null = null;
const snapshotIds = new Set<string>();

const tempDir = path.join(os.tmpdir(), `restic_browser_${process.pid}`);
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Ensure restic path is set
function verifyRestic() {
  if (!resticProgram.resticPath) {
    throw new Error('Restic executable is not found or set on the server.');
  }
}

function verifyLocation() {
  if (!currentLocation || !currentLocation.path) {
    throw new Error('No repository set');
  }
}

app.get('/api/supported_repo_location_types', (req, res) => {
  res.json(supportedLocationTypes);
});

app.get('/api/default_repo_location', (req, res) => {
  res.json(currentLocation || {});
});

app.post('/api/open_repository', (req, res) => {
  try {
    verifyRestic();
    currentLocation = req.body;
    console.log(`Opening repository: '${currentLocation?.path}'...`);
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/get_snapshots', async (req, res) => {
  try {
    verifyRestic();
    verifyLocation();
    
    console.log('Fetching snapshots from repository...');
    const output = await resticProgram.run(currentLocation!, ['snapshots', '--json']);
    const snapshots = JSON.parse(output);
    
    snapshotIds.clear();
    snapshots.forEach((s: any) => snapshotIds.add(s.id));
    
    res.json(snapshots);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/get_files', async (req, res) => {
  try {
    verifyRestic();
    verifyLocation();
    
    const { snapshot_id, path: filePath } = req.body;
    if (!snapshotIds.has(snapshot_id)) {
      throw new Error(`Can't resolve snapshot with id ${snapshot_id}`);
    }

    console.log(`Fetching files from snapshot '${snapshot_id}' at path '${filePath}'...`);
    const output = await resticProgram.run(currentLocation!, ['ls', snapshot_id, '--json', filePath]);
    
    const lines = output.split('\n').filter(line => line.trim().startsWith('{'));
    const files = lines
      .map(line => JSON.parse(line))
      .filter((f: any) => typeof f.path === 'string'); // Filter out snapshot-level metadata lines
    
    res.json(files);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dump_file_to_temp', async (req, res) => {
  try {
    verifyRestic();
    verifyLocation();
    
    const { snapshot_id, file } = req.body;
    if (!snapshotIds.has(snapshot_id)) {
      throw new Error(`Can't resolve snapshot with id ${snapshot_id}`);
    }

    const isDir = file.type === 'dir' || file.type_ === 'dir';
    const targetFileName = isDir ? `${file.name}.zip` : file.name;
    const targetFilePath = path.join(tempDir, targetFileName);
    
    console.log(`Previewing/Dumping file '${file.name}' from snapshot '${snapshot_id}'...`);
    
    const writeStream = fs.createWriteStream(targetFilePath);
    
    await resticProgram.runRedirected(
      currentLocation!,
      ['dump', '-a', 'zip', snapshot_id, file.path],
      writeStream
    );
    
    res.json({ download_url: `/api/download/${encodeURIComponent(targetFileName)}` });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(tempDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve static frontend files
const frontendDistPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
