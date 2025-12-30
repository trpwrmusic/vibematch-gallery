import React, { useState, useRef, useEffect } from 'react';
import { GalleryImage, Gallery } from '../types';
import { analyzeImage } from '../services/geminiService';
import {
    loadGalleryImages,
    saveImage,
    saveImages,
    deleteImage,
    updateGallery,
} from '../services/storageService';
import { Button } from './Button';
import { ImageGeneratorModal } from './ImageGeneratorModal';
import { ImageEditorModal } from './ImageEditorModal';
import { ImageViewerModal } from './ImageViewerModal';

interface GalleryViewProps {
    gallery: Gallery;
    onBack: () => void;
    onGalleryUpdated: (gallery: Gallery) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
    gallery,
    onBack,
    onGalleryUpdated,
}) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [viewingImage, setViewingImage] = useState<GalleryImage | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{
        current: number;
        total: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedName, setEditedName] = useState(gallery.name);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load images for this gallery on mount
    useEffect(() => {
        const loadStoredImages = async () => {
            try {
                const storedImages = await loadGalleryImages(gallery.id);
                setImages(storedImages);
            } catch (err) {
                console.error('Failed to load stored images:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadStoredImages();
    }, [gallery.id]);

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files) as File[];
        setUploadProgress({ current: 0, total: fileArray.length });

        const newGalleryImages: GalleryImage[] = [];

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            setUploadProgress({ current: i + 1, total: fileArray.length });

            try {
                const imageData: string = await new Promise(
                    (resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) =>
                            resolve(e.target?.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    }
                );

                const base64 = imageData.split(',')[1];
                const mimeType = file.type;

                // Analyze image as soon as it's uploaded
                const description = await analyzeImage(base64, mimeType);

                newGalleryImages.push({
                    id: Math.random().toString(36).substr(2, 9),
                    galleryId: gallery.id,
                    url: imageData,
                    base64,
                    mimeType,
                    description,
                    timestamp: Date.now(),
                });
            } catch (err) {
                console.error(`Upload failed for file ${file.name}:`, err);
            }
        }

        // Save to IndexedDB for persistence
        if (newGalleryImages.length > 0) {
            await saveImages(newGalleryImages);
        }

        setImages((prev) => [...newGalleryImages, ...prev]);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageUpdated = async (updated: GalleryImage) => {
        await saveImage(updated);
        setImages((prev) =>
            prev.map((img) => (img.id === updated.id ? updated : img))
        );
    };

    const handleAddImageGenerated = async (newImage: GalleryImage) => {
        // Ensure the generated image is associated with this gallery
        const imageWithGallery = { ...newImage, galleryId: gallery.id };
        await saveImage(imageWithGallery);
        setImages((prev) => [imageWithGallery, ...prev]);
    };

    const handleDeleteImage = async (imageId: string) => {
        await deleteImage(imageId);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const handleSaveTitle = async () => {
        if (editedName.trim() && editedName !== gallery.name) {
            const updatedGallery = { ...gallery, name: editedName.trim() };
            await updateGallery(updatedGallery);
            onGalleryUpdated(updatedGallery);
        }
        setIsEditingTitle(false);
    };

    const isUploading = uploadProgress !== null;

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10">
            <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-4">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <div>
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') {
                                        setEditedName(gallery.name);
                                        setIsEditingTitle(false);
                                    }
                                }}
                                className="text-3xl font-extrabold tracking-tight bg-transparent border-b-2 border-indigo-500 focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditingTitle(true)}
                                className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {gallery.name}
                            </h1>
                        )}
                        <p className="text-zinc-500 mt-1">
                            {images.length}{' '}
                            {images.length === 1 ? 'Foto' : 'Fotos'}
                            {gallery.description && ` • ${gallery.description}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*"
                            multiple
                        />
                        <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            loading={isUploading}
                        >
                            Fotos hochladen
                        </Button>
                    </div>
                    {isUploading && (
                        <div className="w-full sm:w-64 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span>Analysiere Vibe...</span>
                                <span>
                                    {uploadProgress.current} /{' '}
                                    {uploadProgress.total}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{
                                        width: `${
                                            (uploadProgress.current /
                                                uploadProgress.total) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Top Left "ADD" Card */}
                    <div
                        onClick={() =>
                            images.length > 0 &&
                            !isUploading &&
                            setIsGeneratorOpen(true)
                        }
                        className={`aspect-square rounded-3xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center p-8 transition-all duration-300 group ${
                            images.length > 0 && !isUploading
                                ? 'cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5'
                                : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                            <svg
                                className="w-8 h-8 text-zinc-400 group-hover:text-white"
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
                        <h3 className="text-lg font-bold text-zinc-300 group-hover:text-white">
                            Vibe erweitern
                        </h3>
                        <p className="text-zinc-500 text-sm text-center mt-2 px-4">
                            {isUploading
                                ? 'Warte auf Uploads...'
                                : images.length > 0
                                ? 'Lass die AI passende Fotos zu deiner Sammlung vorschlagen'
                                : 'Lade mindestens ein Foto hoch, um die AI-Erweiterung zu nutzen'}
                        </p>
                    </div>

                    {/* Gallery Images */}
                    {images.map((image) => (
                        <div
                            key={image.id}
                            onClick={() => setViewingImage(image)}
                            className="relative aspect-square rounded-3xl overflow-hidden group shadow-xl bg-zinc-900 border border-zinc-800 cursor-pointer"
                        >
                            <img
                                src={image.url}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                alt={image.description.subject}
                            />

                            {/* View Icon on Hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-14 h-14 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-7 h-7 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                <div className="flex gap-2 mb-4 flex-wrap">
                                    {image.description.visualElements
                                        .slice(0, 3)
                                        .map((tag, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] uppercase tracking-widest font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-400 text-xs font-medium">
                                            {image.description.mood} mood
                                        </span>
                                        <span className="text-white font-semibold truncate max-w-[150px]">
                                            {image.description.subject}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            className="rounded-full !px-4"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingImage(image);
                                            }}
                                        >
                                            Bearbeiten
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-full !px-3 !bg-red-500/20 hover:!bg-red-500/40"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(image.id);
                                            }}
                                        >
                                            <svg
                                                className="w-4 h-4"
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
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State placeholder */}
                    {images.length === 0 && !isUploading && !isLoading && (
                        <div className="aspect-square flex items-center justify-center text-zinc-700 italic border border-zinc-800/30 rounded-3xl">
                            Warte auf dein erstes Foto...
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="aspect-square flex flex-col items-center justify-center text-zinc-500 border border-zinc-800/30 rounded-3xl gap-3">
                            <svg
                                className="w-8 h-8 animate-spin"
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
                            <span>Lade Galerie...</span>
                        </div>
                    )}
                </div>
            </main>

            <ImageGeneratorModal
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                galleryImages={images}
                onImageGenerated={handleAddImageGenerated}
            />

            <ImageEditorModal
                isOpen={!!editingImage}
                onClose={() => setEditingImage(null)}
                image={editingImage}
                onImageUpdated={handleImageUpdated}
            />

            <ImageViewerModal
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                image={viewingImage}
                onEdit={(img) => {
                    setViewingImage(null);
                    setEditingImage(img);
                }}
            />

            <footer className="mt-20 py-10 border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-sm">
                    Powered by Gemini AI (Flash Image & Flash 3)
                </p>
            </footer>
        </div>
    );
};
