import React from 'react';
import { GalleryImage } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    image: GalleryImage | null;
    onEdit?: (image: GalleryImage) => void;
}

export const ImageViewerModal: React.FC<Props> = ({
    isOpen,
    onClose,
    image,
    onEdit,
}) => {
    if (!image) return null;

    const handleDownload = () => {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = image.url;

        // Generate filename from subject or use default
        const filename = `${image.description.subject
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 30)}_${image.id}.png`;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex flex-col items-center">
                {/* Image Container */}
                <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                    <img
                        src={image.url}
                        alt={image.description.subject}
                        className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>

                {/* Image Info */}
                <div className="w-full mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {image.description.visualElements.map((tag, i) => (
                            <span
                                key={i}
                                className="text-[10px] uppercase tracking-widest font-bold bg-zinc-800 px-3 py-1.5 rounded-full text-zinc-400"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">
                                {image.description.subject}
                            </h3>
                            <p className="text-zinc-500 text-sm">
                                {image.description.mood} mood •{' '}
                                {image.description.style} •{' '}
                                {image.description.lighting} lighting
                            </p>
                            <div className="flex gap-2 mt-2">
                                {image.description.colors
                                    .slice(0, 5)
                                    .map((color, i) => (
                                        <span
                                            key={i}
                                            className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded"
                                        >
                                            {color}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-zinc-800">
                        <Button
                            variant="primary"
                            onClick={handleDownload}
                            className="flex-1 sm:flex-none"
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
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Download
                        </Button>

                        {onEdit && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    onClose();
                                    onEdit(image);
                                }}
                                className="flex-1 sm:flex-none"
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
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                                Mit AI bearbeiten
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1 sm:flex-none"
                        >
                            Schließen
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
