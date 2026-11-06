// A sandboxed preload script cannot be an ES module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  run: (action) => ipcRenderer.invoke('action', action),
})
