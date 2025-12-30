
import React, { useState } from 'react';
import { GalleryImage } from '../types';
import { editImage, analyzeImage } from '../services/geminiService';
import { Button } from './Button';
import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  image: GalleryImage | null;
  onImageUpdated: (updated: GalleryImage) => void;
}

export const ImageEditorModal: React.FC<Props> = ({ isOpen, onClose, image, onImageUpdated }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setError(null);
    try {
      const editedBase64 = await editImage(prompt, image);
      const description = await analyzeImage(editedBase64, "image/png");
      
      const updatedImage: GalleryImage = {
        ...image,
        url: `data:image/png;base64,${editedBase64}`,
        base64: editedBase64,
        description
      };
      
      setResult(editedBase64);
      onImageUpdated(updatedImage);
    } catch (err) {
      setError("Editing failed. Try a different prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setResult(null);
    setError(null);
    onClose();
  };

  if (!image) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Edit with AI"
      footer={
        result ? (
          <Button onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button disabled={!prompt} loading={loading} onClick={handleEdit}>Apply Edit</Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Original</p>
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
               <img src={image.url} className="w-full h-full object-cover" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Result</p>
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {result ? (
                <img src={`data:image/png;base64,${result}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-zinc-600 text-center p-4">
                  {loading ? (
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    <p className="text-sm">Submit a prompt to see changes</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {!result && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">What would you like to change?</label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="e.g. 'Add a retro film grain', 'Make it golden hour lighting', 'Change the sky to purple'"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <p className="text-zinc-500 text-xs">Be specific for best results.</p>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20">{error}</p>
        )}
      </div>
    </Modal>
  );
};
