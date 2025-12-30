import React, { useState, useEffect } from 'react';
import { GalleryImage, AIIdea } from '../types';
import {
    suggestGalleryIdeas,
    generateThemedImage,
    analyzeImage,
} from '../services/geminiService';
import { Button } from './Button';
import { Modal } from './Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    galleryImages: GalleryImage[];
    onImageGenerated: (image: GalleryImage) => void;
}

enum Step {
    CHOICE, // New: Choose between AI ideas or custom prompt
    IDEAS,
    CUSTOM_PROMPT, // New: Enter custom prompt
    REFERENCES,
    GENERATING,
    COMPLETE,
}

export const ImageGeneratorModal: React.FC<Props> = ({
    isOpen,
    onClose,
    galleryImages,
    onImageGenerated,
}) => {
    const [step, setStep] = useState<Step>(Step.CHOICE);
    const [ideas, setIdeas] = useState<AIIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<AIIdea | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);

    // Only load ideas when user chooses AI suggestions, not on modal open
    const handleChooseAI = async () => {
        setStep(Step.IDEAS);
        setLoading(true);
        setError(null);
        try {
            const suggested = await suggestGalleryIdeas(galleryImages);
            setIdeas(suggested);
        } catch (err: any) {
            setError(
                err.message || 'Failed to generate ideas. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChooseCustom = () => {
        setStep(Step.CUSTOM_PROMPT);
    };

    const handleSelectIdea = (idea: AIIdea) => {
        setSelectedIdea(idea);
        setStep(Step.REFERENCES);
    };

    const toggleRef = (id: string) => {
        setSelectedRefs((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : prev.length < 3
                ? [...prev, id]
                : prev
        );
    };

    const handleCustomPromptSubmit = () => {
        if (customPrompt.trim().length > 0) {
            setStep(Step.REFERENCES);
        }
    };

    const handleGenerate = async () => {
        const promptToUse = selectedIdea?.prompt || customPrompt;
        if (!promptToUse || selectedRefs.length === 0) return;

        setStep(Step.GENERATING);
        setLoading(true);
        setError(null);
        try {
            const refImages = galleryImages.filter((img) =>
                selectedRefs.includes(img.id)
            );
            const resultBase64 = await generateThemedImage(
                promptToUse,
                refImages
            );

            // Analyze the newly generated image to keep metadata consistency
            const description = await analyzeImage(resultBase64, 'image/png');

            const newImage: GalleryImage = {
                id: Math.random().toString(36).substr(2, 9),
                url: `data:image/png;base64,${resultBase64}`,
                base64: resultBase64,
                mimeType: 'image/png',
                description,
                timestamp: Date.now(),
            };

            setGeneratedBase64(resultBase64);
            onImageGenerated(newImage);
            setStep(Step.COMPLETE);
        } catch (err: any) {
            console.error('HandleGenerate catch:', err);
            setError(err.message || 'Generation failed. Please try again.');
            setStep(Step.REFERENCES);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(Step.CHOICE);
        setSelectedIdea(null);
        setCustomPrompt('');
        setSelectedRefs([]);
        setGeneratedBase64(null);
        setError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                step === Step.CHOICE
                    ? 'Expand Your Gallery'
                    : step === Step.IDEAS
                    ? 'AI Vibes: Suggesting Ideas'
                    : step === Step.CUSTOM_PROMPT
                    ? 'Enter Your Custom Prompt'
                    : step === Step.REFERENCES
                    ? 'Select Style References'
                    : step === Step.GENERATING
                    ? 'Generating Your Masterpiece...'
                    : 'Generation Complete'
            }
            size="lg"
            footer={
                step === Step.CUSTOM_PROMPT ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setStep(Step.CHOICE)}
                        >
                            Back
                        </Button>
                        <Button
                            disabled={customPrompt.trim().length === 0}
                            onClick={handleCustomPromptSubmit}
                        >
                            Next: Select References
                        </Button>
                    </>
                ) : step === Step.REFERENCES ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setStep(
                                    selectedIdea
                                        ? Step.IDEAS
                                        : Step.CUSTOM_PROMPT
                                )
                            }
                        >
                            Back
                        </Button>
                        <Button
                            disabled={selectedRefs.length === 0}
                            onClick={handleGenerate}
                            loading={loading}
                        >
                            Generate Image ({selectedRefs.length}/3)
                        </Button>
                    </>
                ) : step === Step.COMPLETE ? (
                    <Button onClick={handleClose}>Done</Button>
                ) : null
            }
        >
            {/* Step 1: Choose Mode */}
            {step === Step.CHOICE && (
                <div className="space-y-6">
                    <p className="text-zinc-400 text-sm">
                        How would you like to expand your gallery?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleChooseAI}
                            className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl hover:border-indigo-500 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600/40 transition-colors">
                                <svg
                                    className="w-6 h-6 text-indigo-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                            <h4 className="font-bold text-white mb-2 group-hover:text-indigo-400">
                                AI Suggestions
                            </h4>
                            <p className="text-zinc-500 text-sm">
                                Let AI analyze your gallery and suggest matching
                                image ideas automatically.
                            </p>
                        </button>
                        <button
                            onClick={handleChooseCustom}
                            className="p-6 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl hover:border-emerald-500 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600/40 transition-colors">
                                <svg
                                    className="w-6 h-6 text-emerald-400"
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
                            </div>
                            <h4 className="font-bold text-white mb-2 group-hover:text-emerald-400">
                                Custom Prompt
                            </h4>
                            <p className="text-zinc-500 text-sm">
                                Write your own prompt and use your gallery
                                images as style references.
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2a: Custom Prompt Input */}
            {step === Step.CUSTOM_PROMPT && (
                <div className="space-y-6">
                    <p className="text-zinc-400 text-sm">
                        Describe what you want to generate. Your gallery images
                        will be used as style references.
                    </p>
                    <div className="space-y-2">
                        <label className="block text-zinc-300 font-medium text-sm">
                            Your Prompt
                        </label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="E.g., A serene mountain lake at sunset with reflections, professional photography style..."
                            className="w-full h-32 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none transition-colors"
                        />
                        <p className="text-zinc-500 text-xs">
                            Be descriptive! Include details about subject,
                            style, lighting, colors, and mood.
                        </p>
                    </div>
                </div>
            )}

            {/* Step 2b: AI Ideas */}
            {step === Step.IDEAS && (
                <div className="space-y-4">
                    <p className="text-zinc-400 text-sm mb-6">
                        Based on your current gallery, I've suggested these
                        directions:
                    </p>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 animate-pulse">
                                Analyzing gallery vibe...
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ideas.map((idea) => (
                                <button
                                    key={idea.id}
                                    onClick={() => handleSelectIdea(idea)}
                                    className="text-left p-6 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-indigo-500 hover:bg-zinc-800 transition-all group"
                                >
                                    <h4 className="font-bold text-white group-hover:text-indigo-400 mb-1">
                                        {idea.title}
                                    </h4>
                                    <p className="text-zinc-400 text-sm mb-2">
                                        {idea.reason}
                                    </p>
                                    <div className="inline-flex text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded">
                                        PROMPT: {idea.prompt.substring(0, 100)}
                                        ...
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === Step.REFERENCES && (
                <div className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm animate-pulse">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <div
                        className={`p-4 rounded-lg ${
                            selectedIdea
                                ? 'bg-indigo-600/10 border border-indigo-500/20'
                                : 'bg-emerald-600/10 border border-emerald-500/20'
                        }`}
                    >
                        <h4
                            className={`font-semibold mb-1 ${
                                selectedIdea
                                    ? 'text-indigo-400'
                                    : 'text-emerald-400'
                            }`}
                        >
                            {selectedIdea
                                ? `Concept: ${selectedIdea.title}`
                                : 'Your Custom Prompt'}
                        </h4>
                        <p className="text-zinc-400 text-sm">
                            {selectedIdea?.prompt || customPrompt}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-zinc-300 font-medium">
                            Pick up to 3 images to guide the style:
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {galleryImages.map((img) => (
                                <div
                                    key={img.id}
                                    onClick={() => toggleRef(img.id)}
                                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative group transition-all ${
                                        selectedRefs.includes(img.id)
                                            ? 'ring-4 ring-indigo-500 scale-95'
                                            : 'hover:opacity-80'
                                    }`}
                                >
                                    <img
                                        src={img.url}
                                        className="w-full h-full object-cover"
                                    />
                                    {selectedRefs.includes(img.id) && (
                                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                                            <svg
                                                className="w-8 h-8 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === Step.GENERATING && (
                <div className="flex flex-col items-center justify-center py-20 space-y-8">
                    <div className="relative">
                        <div className="w-24 h-24 border-8 border-indigo-600/20 rounded-full"></div>
                        <div className="absolute inset-0 w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-xl font-bold text-white">
                            Blending the vibe...
                        </h4>
                        <p className="text-zinc-500 max-w-xs mx-auto italic">
                            Mixing your selected styles with our AI concept.
                            This usually takes 10-20 seconds.
                        </p>
                    </div>
                </div>
            )}

            {step === Step.COMPLETE && generatedBase64 && (
                <div className="space-y-6 flex flex-col items-center">
                    <div className="aspect-square w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/30">
                        <img
                            src={`data:image/png;base64,${generatedBase64}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <h4 className="text-2xl font-bold text-white mb-2">
                            Success!
                        </h4>
                        <p className="text-zinc-400">
                            The new image has been added to your gallery.
                        </p>
                    </div>
                </div>
            )}
        </Modal>
    );
};
