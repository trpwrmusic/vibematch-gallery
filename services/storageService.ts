import { GalleryImage, Gallery } from '../types';

const DB_NAME = 'vibematch-gallery';
const DB_VERSION = 2; // Bumped for new galleries store
const IMAGES_STORE = 'images';
const GALLERIES_STORE = 'galleries';

let dbInstance: IDBDatabase | null = null;

/**
 * Opens and returns the IndexedDB database instance.
 * Uses singleton pattern to avoid multiple connections.
 */
const openDB = (): Promise<IDBDatabase> => {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store for images with 'id' as the key
            if (!db.objectStoreNames.contains(IMAGES_STORE)) {
                const store = db.createObjectStore(IMAGES_STORE, {
                    keyPath: 'id',
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('galleryId', 'galleryId', { unique: false });
            } else {
                // Add galleryId index if upgrading
                const transaction = (event.target as IDBOpenDBRequest)
                    .transaction;
                if (transaction) {
                    const store = transaction.objectStore(IMAGES_STORE);
                    if (!store.indexNames.contains('galleryId')) {
                        store.createIndex('galleryId', 'galleryId', {
                            unique: false,
                        });
                    }
                }
            }

            // Create galleries store
            if (!db.objectStoreNames.contains(GALLERIES_STORE)) {
                const galleriesStore = db.createObjectStore(GALLERIES_STORE, {
                    keyPath: 'id',
                });
                galleriesStore.createIndex('createdAt', 'createdAt', {
                    unique: false,
                });
            }
        };
    });
};

// ==================== GALLERY FUNCTIONS ====================

/**
 * Creates a new gallery.
 */
export const createGallery = async (
    name: string,
    description?: string
): Promise<Gallery> => {
    const db = await openDB();
    const gallery: Gallery = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GALLERIES_STORE], 'readwrite');
        const store = transaction.objectStore(GALLERIES_STORE);
        const request = store.put(gallery);

        request.onsuccess = () => resolve(gallery);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Updates an existing gallery.
 */
export const updateGallery = async (gallery: Gallery): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GALLERIES_STORE], 'readwrite');
        const store = transaction.objectStore(GALLERIES_STORE);
        gallery.updatedAt = Date.now();
        const request = store.put(gallery);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Loads all galleries from IndexedDB, sorted by createdAt (newest first).
 */
export const loadAllGalleries = async (): Promise<Gallery[]> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GALLERIES_STORE], 'readonly');
        const store = transaction.objectStore(GALLERIES_STORE);
        const index = store.index('createdAt');

        const galleries: Gallery[] = [];
        const request = index.openCursor(null, 'prev');

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
                .result;
            if (cursor) {
                galleries.push(cursor.value as Gallery);
                cursor.continue();
            } else {
                resolve(galleries);
            }
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Loads a single gallery by ID.
 */
export const loadGallery = async (
    galleryId: string
): Promise<Gallery | null> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([GALLERIES_STORE], 'readonly');
        const store = transaction.objectStore(GALLERIES_STORE);
        const request = store.get(galleryId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Deletes a gallery and all its images.
 */
export const deleteGallery = async (galleryId: string): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            [GALLERIES_STORE, IMAGES_STORE],
            'readwrite'
        );

        // Delete gallery
        const galleriesStore = transaction.objectStore(GALLERIES_STORE);
        galleriesStore.delete(galleryId);

        // Delete all images in this gallery
        const imagesStore = transaction.objectStore(IMAGES_STORE);
        const index = imagesStore.index('galleryId');
        const request = index.openCursor(IDBKeyRange.only(galleryId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
                .result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

// ==================== IMAGE FUNCTIONS ====================

/**
 * Saves a single image to IndexedDB.
 */
export const saveImage = async (image: GalleryImage): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        const request = store.put(image);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Saves multiple images to IndexedDB in a single transaction.
 */
export const saveImages = async (images: GalleryImage[]): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);

        images.forEach((image) => {
            store.put(image);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

/**
 * Loads all images for a specific gallery, sorted by timestamp (newest first).
 */
export const loadGalleryImages = async (
    galleryId: string
): Promise<GalleryImage[]> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readonly');
        const store = transaction.objectStore(IMAGES_STORE);
        const index = store.index('galleryId');

        const images: GalleryImage[] = [];
        const request = index.openCursor(IDBKeyRange.only(galleryId));

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
                .result;
            if (cursor) {
                images.push(cursor.value as GalleryImage);
                cursor.continue();
            } else {
                // Sort by timestamp descending (newest first)
                images.sort((a, b) => b.timestamp - a.timestamp);
                resolve(images);
            }
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Loads all images from IndexedDB, sorted by timestamp (newest first).
 * @deprecated Use loadGalleryImages instead for multi-gallery support
 */
export const loadAllImages = async (): Promise<GalleryImage[]> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readonly');
        const store = transaction.objectStore(IMAGES_STORE);
        const index = store.index('timestamp');

        const images: GalleryImage[] = [];
        const request = index.openCursor(null, 'prev');

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
                .result;
            if (cursor) {
                images.push(cursor.value as GalleryImage);
                cursor.continue();
            } else {
                resolve(images);
            }
        };

        request.onerror = () => reject(request.error);
    });
};

/**
 * Deletes a single image from IndexedDB by ID.
 */
export const deleteImage = async (imageId: string): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        const request = store.delete(imageId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Clears all images from IndexedDB.
 */
export const clearAllImages = async (): Promise<void> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * Gets the count of stored images in a gallery.
 */
export const getGalleryImageCount = async (
    galleryId: string
): Promise<number> => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGES_STORE], 'readonly');
        const store = transaction.objectStore(IMAGES_STORE);
        const index = store.index('galleryId');
        const request = index.count(IDBKeyRange.only(galleryId));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Gets the first image of a gallery (for cover).
 */
export const getGalleryCoverImage = async (
    galleryId: string
): Promise<GalleryImage | null> => {
    const images = await loadGalleryImages(galleryId);
    return images.length > 0 ? images[0] : null;
};
