import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Start the Express backend server
import './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'CricfyTV',
    autoHideMenuBar: true, // Hides the default menu
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the web app which will point to our Express backend
  // We use our express backend to serve both the API and the static files
  // Give the server a small moment to boot up and bind to port 3001
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 500);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
