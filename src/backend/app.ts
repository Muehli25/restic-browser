import type { restic } from "./restic";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.error || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export namespace resticApp {
  export function supportedRepoLocationTypes(): Promise<restic.RepositoryLocationType[]> {
    return fetchApi<restic.RepositoryLocationType[]>("supported_repo_location_types");
  }

  export function defaultRepoLocation(): Promise<restic.Location> {
    return fetchApi<restic.Location>("default_repo_location");
  }

  export async function openFileOrUrl(path: string): Promise<void> {
    // Open in browser
    window.open(path, '_blank');
  }

  export async function verifyResticPath(): Promise<void> {
    // Handled internally by the backend. No-op for frontend unless an error is thrown on other routes.
  }

  export function openRepository(location: restic.Location): Promise<void> {
    return fetchApi<void>("open_repository", {
      method: "POST",
      body: JSON.stringify(location)
    });
  }

  export function getSnapshots(): Promise<Array<restic.Snapshot>> {
    return fetchApi<Array<restic.Snapshot>>("get_snapshots");
  }

  export function getFiles(snapshotId: string, path: string): Promise<Array<restic.File>> {
    return fetchApi<Array<restic.File>>("get_files", {
      method: "POST",
      body: JSON.stringify({ snapshot_id: snapshotId, path })
    });
  }

  export async function dumpFile(snapshotId: string, file: restic.File): Promise<string> {
    const res = await fetchApi<{download_url: string}>("dump_file_to_temp", {
      method: "POST",
      body: JSON.stringify({ snapshot_id: snapshotId, file })
    });
    // Trigger download in browser
    const host = import.meta.env.DEV ? "http://localhost:8000" : "";
    window.open(`${host}${res.download_url}`, '_blank');
    return "Downloaded";
  }

  export async function dumpFileToTemp(snapshotId: string, file: restic.File): Promise<string> {
    return dumpFile(snapshotId, file);
  }

  export async function restoreFile(snapshotId: string, file: restic.File): Promise<string> {
    // For a web app, restoring is practically downloading unless we are restoring to the server's disk
    return dumpFile(snapshotId, file);
  }
}
