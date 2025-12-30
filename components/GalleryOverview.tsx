import React, { useState, useEffect } from 'react';
import { Gallery, GalleryImage } from '../types';
import {
    loadAllGalleries,
    createGallery,
    deleteGallery,
    getGalleryImageCount,
    getGalleryCoverImage,
} from '../services/storageService';
import { Button } from './Button';
import { Modal } from './Modal';

interface GalleryOverviewProps {
    onSelectGallery: (gallery: Gallery) => void;
}

interface GalleryWithMeta extends Gallery {
    imageCount: number;
    coverImage: GalleryImage | null;
}

export const GalleryOverview: React.FC<GalleryOverviewProps> = ({
    onSelectGallery,
}) => {
    const [galleries, setGalleries] = useState<GalleryWithMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGalleryName, setNewGalleryName] = useState('');
    const [newGalleryDesc, setNewGalleryDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const loadGalleries = async () => {
        try {
            const allGalleries = await loadAllGalleries();
            const galleriesWithMeta: GalleryWithMeta[] = await Promise.all(
                allGalleries.map(async (gallery) => ({
                    ...gallery,
                    imageCount: await getGalleryImageCount(gallery.id),
                    coverImage: await getGalleryCoverImage(gallery.id),
                }))
            );
            setGalleries(galleriesWithMeta);
        } catch (err) {
            console.error('Failed to load galleries:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGalleries();
    }, []);

    const handleCreateGallery = async () => {
        if (!newGalleryName.trim()) return;

        setIsCreating(true);
        try {
            const gallery = await createGallery(
                newGalleryName.trim(),
                newGalleryDesc.trim() || undefined
            );
            setGalleries((prev) => [
                { ...gallery, imageCount: 0, coverImage: null },
                ...prev,
            ]);
            setIsModalOpen(false);
            setNewGalleryName('');
            setNewGalleryDesc('');
        } catch (err) {
            console.error('Failed to create gallery:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteGallery = async (galleryId: string) => {
        try {
            await deleteGallery(galleryId);
            setGalleries((prev) => prev.filter((g) => g.id !== galleryId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete gallery:', err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10">
            <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        VibeMatch
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        AI-driven aesthetic gallery extension
                    </p>
                </div>

                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Neue Galerie
                </Button>
            </header>

            <main className="max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 gap-4">
                        <svg
                            className="w-10 h-10 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <span>Lade Galerien...</span>
                    </div>
                ) : galleries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center">
                            <svg
                                className="w-12 h-12 text-zinc-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-zinc-300 mb-2">
                                Noch keine Galerien
                            </h2>
                            <p className="text-zinc-500 max-w-md">
                                Erstelle deine erste Galerie, um Fotos
                                hochzuladen und AI-generierte Bilder passend zu
                                deinem Stil zu erstellen.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Erste Galerie erstellen
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Create New Gallery Card */}
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="aspect-video rounded-3xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer group hover:border-indigo-500/50 hover:bg-indigo-500/5"
                        >
                            <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-colors">
                                <svg
                                    className="w-7 h-7 text-zinc-400 group-hover:text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-zinc-300 group-hover:text-white">
                                Neue Galerie
                            </h3>
                        </div>

                        {/* Gallery Cards */}
                        {galleries.map((gallery) => (
                            <div
                                key={gallery.id}
                                onClick={() => onSelectGallery(gallery)}
                                className="relative aspect-video rounded-3xl overflow-hidden group cursor-pointer shadow-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 transition-all duration-300"
                            >
                                {/* Cover Image or Placeholder */}
                                {gallery.coverImage ? (
                                    <img
                                        src={gallery.coverImage.url}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={gallery.name}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                        <svg
                                            className="w-16 h-16 text-zinc-700"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.5"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded">
                                            {gallery.imageCount}{' '}
                                            {gallery.imageCount === 1
                                                ? 'Foto'
                                                : 'Fotos'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white truncate">
                                        {gallery.name}
                                    </h3>
                                    {gallery.description && (
                                        <p className="text-zinc-400 text-sm truncate mt-1">
                                            {gallery.description}
                                        </p>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm(gallery.id);
                                    }}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/50"
                                >
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Gallery Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-2xl font-bold mb-6">
                    Neue Galerie erstellen
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={newGalleryName}
                            onChange={(e) => setNewGalleryName(e.target.value)}
                            placeholder="z.B. Herbstfotos 2024"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Beschreibung (optional)
                        </label>
                        <textarea
                            value={newGalleryDesc}
                            onChange={(e) => setNewGalleryDesc(e.target.value)}
                            placeholder="Worum geht es in dieser Galerie?"
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateGallery}
                            loading={isCreating}
                            disabled={!newGalleryName.trim()}
                            className="flex-1"
                        >
                            Erstellen
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Galerie löschen?</h2>
                    <p className="text-zinc-400 mb-6">
                        Alle Fotos in dieser Galerie werden unwiderruflich
                        gelöscht.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1"
                        >
                            Abbrechen
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() =>
                                deleteConfirm &&
                                handleDeleteGallery(deleteConfirm)
                            }
                            className="flex-1 !bg-red-600 hover:!bg-red-500"
                        >
                            Löschen
                        </Button>
                    </div>
                </div>
            </Modal>

            <footer className="mt-20 py-10 border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-sm">
                    Powered by Gemini AI (Flash Image & Flash 3)
                </p>
            </footer>
        </div>
    );
};
