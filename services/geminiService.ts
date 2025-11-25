import { GoogleGenAI } from "@google/genai";
import { GenerationSettings, RotationMode } from "../types";

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Default fallback key (can be overridden by user)
const DEFAULT_API_KEY = 'AIzaSyDxT26bqfvHBfmXYNqO_xZbmmsQwaw82m8';

const getClient = (customKey?: string | null) => {
  const key = customKey || DEFAULT_API_KEY;
  if (!key) throw new Error("No API Key provided.");
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Uses a text model to expand a simple prompt into a detailed image generation prompt.
 */
export const enhancePrompt = async (originalPrompt: string, customApiKey?: string | null): Promise<string> => {
  const ai = getClient(customApiKey);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert prompt engineer for AI image generation. 
      Rewrite the following simple description into a detailed, high-quality image generation prompt. 
      Focus on lighting, texture, composition, specific details, and artistic style. 
      Keep it under 150 words. Do not add preamble, just return the prompt.
      
      Input: "${originalPrompt}"`,
    });
    
    return response.text || originalPrompt;
  } catch (error) {
    console.error("Magic Prompt Error:", error);
    return originalPrompt; // Fallback to original if error
  }
};

export const generateImage = async (
  settings: GenerationSettings,
  sourceImage?: string | null, // Base64 string of source image
  maskImage?: string | null,   // Base64 string of mask
  referenceImage?: string | null, // Base64 string of reference image
  customApiKey?: string | null // User provided key
): Promise<string> => {
  
  // Initialize Client with the provided API key or default
  const ai = getClient(customApiKey);

  // Construct Parts
  const parts: any[] = [];
  let instructions = "";

  // 1. Add Images First (Best practice for multimodal)
  
  // Handle Source and Mask (Editing context)
  if (sourceImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: sourceImage
      }
    });

    if (maskImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: maskImage
        }
      });
      instructions += "Edit the first image based on the second mask image (white pixels = area to change, black = keep). ";
    } else {
      instructions += "Edit the provided image. ";
    }
  }

  // Handle Reference Image (Style/Content context)
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: referenceImage
      }
    });
    
    if (sourceImage) {
        // If we already have a source image, the reference is likely the 2nd or 3rd image part
        instructions += "Use the last provided image as a strict style/content reference. ";
    } else {
        instructions += "Use the provided image as a visual reference. ";
    }
  }

  // 2. Build Prompt
  let finalPrompt = settings.prompt || "Generate an image";
  
  if (instructions) {
      finalPrompt = `${instructions} ${finalPrompt}`;
  }

  // Join multiple camera angles if they exist
  if (settings.cameraAngles && settings.cameraAngles.length > 0) {
      if (settings.rotationMode === RotationMode.Object) {
          // Object Rotation Logic: Rotate subject, keep environment static
          finalPrompt += `. Subject Pose: ${settings.cameraAngles.join(' + ')}. IMPORTANT: Rotate the subject/character only, keep the environment/background exactly the same.`;
      } else {
          // Camera Rotation Logic: Move camera
          finalPrompt += `, Camera View: ${settings.cameraAngles.join(' + ')}`;
      }
  }
  
  if (settings.timeOfDay) finalPrompt += `, Time: ${settings.timeOfDay}`;
  if (settings.season) finalPrompt += `, Season: ${settings.season}`;
  if (settings.style) finalPrompt += `, Style: ${settings.style}`;
  
  // Add Text Part
  parts.push({ text: finalPrompt });

  const config: any = {
    imageConfig: {
      aspectRatio: settings.aspectRatio,
      imageSize: settings.imageSize, // Supported in gemini-3-pro-image-preview
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Nano Banana Pro
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: config
    });

    // Check for Safety Filters or Empty Responses
    if (!response.candidates || response.candidates.length === 0) {
        // Usually means Safety Filter triggered
        throw new Error("Generation blocked by Safety Filters. Try a different prompt or source image.");
    }

    // Parse Response
    if (response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated in response. The model might have returned text only.");
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = error.message || "Unknown error";
    
    // Improved Error Handling for Quotas/Permissions
    if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "Permission Denied (403). Your API Key may not have access to this model or is restricted.";
        alert(`Gemini Generation Error:\n${JSON.stringify(error, null, 2)}\n\nPLEASE CHECK IF YOUR API KEY HAS BILLING ENABLED OR SUPPORTS GEMINI PRO.`);
    } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "Quota Exceeded (429). You have hit the rate limit or free tier limit.";
        alert(`Gemini Generation Error:\n${JSON.stringify(error, null, 2)}\n\nTRY WAITING A MINUTE.`);
    } else {
        alert(`Gemini Generation Error:\n${errorMessage}`);
    }

    throw new Error(errorMessage);
  }
};