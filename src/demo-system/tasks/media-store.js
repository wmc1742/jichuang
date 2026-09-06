const urls = new Map();
let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('agent2-media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}
export async function storeMedia(file) {
  const db = await openDatabase();
  const id = `local-media:${crypto.randomUUID()}`;
  await new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  urls.set(id, URL.createObjectURL(file));
  return id;
}
export async function loadMedia() {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve();
      urls.set(cursor.key, URL.createObjectURL(cursor.value)); cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
}
export function resolveMedia(html) {
  return html.replace(/local-media:[a-f0-9-]+/g, (id) => urls.get(id) || '');
}
