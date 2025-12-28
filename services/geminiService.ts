
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const spookifyImage = async (
  base64Image: string, 
  templateName: string, 
  decorations: string[],
  customMagic?: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `This is a Halloween photo booth collage with the theme "${templateName}". 
            Please add cute, festive, and high-quality decorations. 
            Include: ${decorations.join(', ')}. 
            ${customMagic ? `ADDITIONAL MAGIC REQUEST: ${customMagic}.` : ''}
            Add cute spider webs in the empty spaces between photos or in the corners. 
            Ensure the people in the photos are still clearly visible but wearing things like cute witch hats or cat ears.
            Make the background of the collage look like a magical, spooky night.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error spookifying image:", error);
    return null;
  }
};

export const generateSpookyCaption = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: 'Give me a short, cute, and punny Halloween caption for this photo booth strip. Max 8 words.',
          },
        ],
      },
    });
    return response.text?.trim() || "Spook-tacular Strip!";
  } catch (error) {
    return "Creepin' it real!";
  }
};
