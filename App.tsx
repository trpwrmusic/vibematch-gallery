import React, { useState } from 'react';
import { Gallery } from './types';
import { GalleryOverview } from './components/GalleryOverview';
import { GalleryView } from './components/GalleryView';

const App: React.FC = () => {
    const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(
        null
    );

    const handleSelectGallery = (gallery: Gallery) => {
        setSelectedGallery(gallery);
    };

    const handleBackToOverview = () => {
        setSelectedGallery(null);
    };

    const handleGalleryUpdated = (updatedGallery: Gallery) => {
        setSelectedGallery(updatedGallery);
    };

    // Show single gallery view if a gallery is selected
    if (selectedGallery) {
        return (
            <GalleryView
                gallery={selectedGallery}
                onBack={handleBackToOverview}
                onGalleryUpdated={handleGalleryUpdated}
            />
        );
    }

    // Show gallery overview (list of all galleries)
    return <GalleryOverview onSelectGallery={handleSelectGallery} />;
};

export default App;
