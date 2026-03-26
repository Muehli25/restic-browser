import { spawn } from 'child_process';
import { WriteStream } from 'fs';

export interface LocationTypeInfo {
  type: string;
  prefix: string;
  displayName: string;
  credentials: string[];
}

export const supportedLocationTypes: LocationTypeInfo[] = [
  { type: 'local', prefix: '', displayName: 'Local Path', credentials: [] },
  { type: 'sftp', prefix: 'sftp', displayName: 'SFTP', credentials: [] },
  { type: 'rest', prefix: 'rest', displayName: 'REST Server', credentials: ['RESTIC_REST_USERNAME', 'RESTIC_REST_PASSWORD'] },
  { type: 'rclone', prefix: 'rclone', displayName: 'RCLONE', credentials: [] },
  { type: 'amazons3', prefix: 's3', displayName: 'Amazon S3', credentials: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] },
  { type: 'msazure', prefix: 'azure', displayName: 'Azure Blob Storage', credentials: ['AZURE_ACCOUNT_NAME', 'AZURE_ACCOUNT_KEY'] },
  { type: 'backblaze', prefix: 'b2', displayName: 'Backblaze B2', credentials: ['B2_ACCOUNT_ID', 'B2_ACCOUNT_KEY'] },
  { type: 'googlecloudstorage', prefix: 'gs', displayName: 'Google Cloud Storage', credentials: ['GOOGLE_PROJECT_ID', 'GOOGLE_APPLICATION_CREDENTIALS'] }
];

export interface EnvValue {
  name: string;
  value: string;
}

export interface Location {
  prefix: string;
  path: string;
  credentials: EnvValue[];
  allowEmptyPassword?: boolean;
  password?: string;
  insecureTls?: boolean;
}

export interface Snapshot {
  id: string;
  short_id: string;
  time: string;
  paths: string[];
  tags: string[];
  hostname: string;
  username: string;
}

export interface File {
  name: string;
  type: string;
  path: string;
  uid: number;
  gid: number;
  size: number;
  mode: number;
  mtime: string;
  atime: string;
  ctime: string;
}

export class Program {
  constructor(
    public resticPath: string,
    public rclonePath: string | null = null
  ) {}

  private async execute(location: Location, args: string[], writeStream?: WriteStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };

      // Setup environment variables for location
      if (location.password) {
        env.RESTIC_PASSWORD = location.password;
      }
      for (const cred of location.credentials || []) {
        if (cred.name && cred.value) {
          env[cred.name] = cred.value;
        }
      }

      // Format location path
      let repoPath = location.path;
      if (location.prefix && location.prefix.length > 0) {
        repoPath = `${location.prefix}:${repoPath}`;
      }

      const allArgs = ['-r', repoPath, '--no-cache'];
      if (location.insecureTls) {
        allArgs.push('--insecure-tls');
      }

      let actualCommand = this.resticPath;
      if (location.prefix === 'rclone' && this.rclonePath) {
        allArgs.push('-o', `rclone.program=${this.rclonePath}`);
      }

      allArgs.push(...args);

      console.log(`Executing: ${actualCommand} ${allArgs.join(' ')}`);

      const child = spawn(actualCommand, allArgs, { env });

      let output = '';
      let errorOutput = '';

      if (writeStream) {
        child.stdout.pipe(writeStream);
      } else {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  public async run(location: Location, args: string[]): Promise<string> {
    return this.execute(location, args);
  }

  public async runRedirected(location: Location, args: string[], writeStream: WriteStream): Promise<void> {
    await this.execute(location, args, writeStream);
  }
}
