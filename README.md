<img src="./src/assets/images/eye.png" alt="drawing" height="48px"/> <img src="./src/assets/images/logo.png" alt="drawing" height="48px"/> 

---
*Note: This project is a fork of the original Tauri/Rust desktop application. It was changed to use a minimal Node.js/TypeScript backend to allow its usage as a web service, designed to be run seamlessly via Docker.*

A simple, cross-platform [restic backup](https://github.com/restic/restic) web application for browsing restic repositories based on the original Tauri/Rust desktop application found [here](https://github.com/emuell/restic-browser).

## Quick Start (Docker)

The easiest way to run the new web-based Restic Browser is using Docker Compose.

```bash
docker-compose up --build
```

Then, open your web browser and navigate to `http://localhost:3000`.


## Features

This is not a fullblown restic backup GUI - it only allows you to *browse* existing repositories!

* *Displays* contents (snapshots, files) from local and remote restic repositories.
* *Dumps* selected files or folders (as a zip archive) to a desired location.
* *Restores* selected files or folders to a desired location.
* *Opens* selected files by moving them to TEMP, then opens them with your operating system's default programs.

![Screenshot](./screenshot.png "Restic Browser")


## Keyboard Navigation

The UI is navigatable via keyboard shortcuts. To change the focus area, hit `Tab` + `Shift-Tab` keys.

### Global Shortcuts: 

- `Control/CMD + O`: Open new repository

### Snapshot-List
- `Arrow keys`, `Page Up/Down`, `Home/End`: Change selected snapshot

### File-List
- `Arrow keys`, `Page Up/Down`, `Home/End`: Change selected file
- `o` or `Enter` or `Space`: Open selected file or folder
- `d`: Dump selected file or folder as zip file
- `r`: Restore selected file or folder


## System Requirements

- **Docker** and **Docker Compose**
- That's it! The Docker image natively packages the latest version of `restic` alongside the Node.js backend.

## Local Development

If you prefer to run the application locally without Docker:

### Dependencies

* Make sure [npm](https://nodejs.org/en/download) *Node* 20 LTS or later is installed.
* Install [restic](https://github.com/restic/restic/releases/) and make sure it is included in your `$PATH`. 

### Running the Backend

The Express backend wraps the `restic` CLI and exposes a REST API.

```bash
cd backend
npm install
npm run build
npm run start
```
*The backend will be available at `http://localhost:8000`.*

### Running the Frontend

The UI uses Vite, Lit, and Vaadin components. Make sure the backend is running first.

```bash
npm install
npm run dev
```
*Vite will hot-reload the frontend at `http://localhost:3000`.*


## License

MIT license. See [LICENSE](./LICENSE) for the full text.


## Contribute

Patches are welcome! Please fork the latest git repository and create a feature branch. 
