export interface ImageDescription {
    subject: string;
    colors: string[];
    style: string;
    mood: string;
    lighting: string;
    visualElements: string[];
}

export interface GalleryImage {
    id: string;
    galleryId: string;
    url: string;
    base64: string;
    mimeType: string;
    description: ImageDescription;
    timestamp: number;
}

export interface Gallery {
    id: string;
    name: string;
    description?: string;
    coverImageId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface AIIdea {
    id: string;
    title: string;
    prompt: string;
    reason: string;
}
