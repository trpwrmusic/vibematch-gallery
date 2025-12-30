import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { GalleryImage, ImageDescription, AIIdea } from '../types';

// Always use the latest instance right before making an API call
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (
    base64: string,
    mimeType: string
): Promise<ImageDescription> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType } },
                    {
                        text: 'Analyze this image and provide a detailed description in JSON format. Describe the subject, colors, style, mood, lighting, and key visual elements.',
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        colors: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        style: { type: Type.STRING },
                        mood: { type: Type.STRING },
                        lighting: { type: Type.STRING },
                        visualElements: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                    required: [
                        'subject',
                        'colors',
                        'style',
                        'mood',
                        'lighting',
                        'visualElements',
                    ],
                },
            },
        });

        if (!response.text) {
            throw new Error('AI analysis returned empty text.');
        }
        return JSON.parse(response.text);
    } catch (err: any) {
        console.error('Analysis Error:', err);
        throw new Error(err.message || 'Failed to analyze image vibe.');
    }
};

export const suggestGalleryIdeas = async (
    images: GalleryImage[]
): Promise<AIIdea[]> => {
    const ai = getAI();
    const descriptions = images
        .map((img) => JSON.stringify(img.description))
        .join('\n---\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on the following image descriptions of an existing gallery, suggest 3 creative new image ideas that would perfectly match the "vibe", style, and color palette of the collection. Return the ideas in JSON format.
      
      Gallery Descriptions:
      ${descriptions}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            prompt: {
                                type: Type.STRING,
                                description:
                                    'Detailed text prompt for image generation',
                            },
                            reason: {
                                type: Type.STRING,
                                description: 'Why this fits the gallery',
                            },
                        },
                        required: ['id', 'title', 'prompt', 'reason'],
                    },
                },
            },
        });

        if (!response.text) return [];
        return JSON.parse(response.text);
    } catch (err: any) {
        console.error('Suggestion Error:', err);
        throw new Error('Failed to suggest matching vibes.');
    }
};

export const generateThemedImage = async (
    prompt: string,
    referenceImages: GalleryImage[]
): Promise<string> => {
    const ai = getAI();

    // Rule Check: Using gemini-3-pro-image-preview.
    // We use the first reference image as a visual anchor to avoid issues with too many parts.
    const primaryRef = referenceImages[0];

    const contents = {
        parts: [
            {
                inlineData: {
                    data: primaryRef.base64,
                    mimeType: primaryRef.mimeType,
                },
            },
            {
                text: `Based on the visual style, colors, and lighting of this reference image, generate a brand new professional photo of: ${prompt}. Ensure it matches the aesthetic perfectly.`,
            },
        ],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        let generatedBase64 = '';
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    generatedBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!generatedBase64) {
            // Check if it was blocked or just didn't return an image
            console.error(
                'Generation Result Parts:',
                response.candidates?.[0]?.content?.parts
            );
            throw new Error(
                'The AI model did not return a generated image. It might be blocked or unsupported.'
            );
        }

        return generatedBase64;
    } catch (err: any) {
        console.error('Generation Error:', err);
        throw new Error(err.message || 'Failed to generate themed image.');
    }
};

export const editImage = async (
    prompt: string,
    sourceImage: GalleryImage
): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: sourceImage.base64,
                            mimeType: sourceImage.mimeType,
                        },
                    },
                    {
                        text: `Edit this image to: ${prompt}. Maintain the original composition while applying these changes.`,
                    },
                ],
            },
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        let editedBase64 = '';
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    editedBase64 = part.inlineData.data;
                    break;
                }
            }
        }

        if (!editedBase64) throw new Error('No edited image was returned.');
        return editedBase64;
    } catch (err: any) {
        console.error('Edit Error:', err);
        throw new Error(err.message || 'Failed to edit image.');
    }
};
