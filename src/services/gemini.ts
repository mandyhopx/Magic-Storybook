import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface Story {
  title: string;
  pages: StoryPage[];
}

export async function generateStory(theme: string, characterName: string): Promise<Story> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a magical 5-page story for kids about ${theme}. The main character is ${characterName}. 
    For each page, provide the story text (1-2 sentences) and a descriptive prompt for an illustrator to create a matching image.
    The story should be wholesome and exciting.`,
    config: {
      systemInstruction: "You are a professional children's book author and illustrator coordinator.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "1-2 sentences of the story for this page." },
                imagePrompt: { type: Type.STRING, description: "Detailed prompt for an AI image generator to create a whimsical illustration for this page. Include style keywords like 'storybook illustration', 'soft colors', 'whimsical', 'children's book style'." }
              },
              required: ["text", "imagePrompt"]
            }
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate story content");
  }

  return JSON.parse(response.text.trim());
}

export async function generateIllustration(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "4:3",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini");
}

function addWavHeader(pcmData: Uint8Array, sampleRate: number) {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);

  v.setUint32(0, 0x52494646, false); // "RIFF"
  v.setUint32(4, 36 + pcmData.length, true);
  v.setUint32(8, 0x57415645, false); // "WAVE"
  v.setUint32(12, 0x666d7420, false); // "fmt "
  v.setUint32(16, 16, true); // subchunk1size
  v.setUint16(20, 1, true); // audioformat (PCM)
  v.setUint16(22, 1, true); // numchannels
  v.setUint32(24, sampleRate, true); // samplerate
  v.setUint32(28, sampleRate * 2, true); // byterate
  v.setUint16(32, 2, true); // blockalign
  v.setUint16(34, 16, true); // bitspersample
  v.setUint32(36, 0x64617461, false); // "data"
  v.setUint32(40, pcmData.length, true);

  const combined = new Uint8Array(header.byteLength + pcmData.length);
  combined.set(new Uint8Array(header), 0);
  combined.set(pcmData, 44);
  return combined;
}

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Read this storybook page with a warm, friendly, storytelling voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }, // Warm voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini");
  }

  // Convert base64 to a Blob URL with a WAV header
  const binary = atob(base64Audio);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  const wavBytes = addWavHeader(bytes, 24000);
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
