import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div
                className={`relative w-full ${sizes[size]} bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
            >
                {title ? (
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <h3 className="text-xl font-semibold text-white">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-zinc-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}

                <div
                    className={`p-6 overflow-y-auto flex-1 ${
                        !title ? 'pt-14' : ''
                    }`}
                >
                    {children}
                </div>

                {footer && (
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
