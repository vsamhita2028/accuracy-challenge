const DB = 'memo-accuracy-challenge';
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage is blocked'));
  });
}
async function transact(mode, action) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('results', mode);
    const request = action(tx.objectStore('results'));
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Storage transaction aborted')); };
  });
}
export const getResults = () => transact('readonly', store => store.getAll());
export const saveResult = result => transact('readwrite', store => store.add(result));
export const clearResults = () => transact('readwrite', store => store.clear());
