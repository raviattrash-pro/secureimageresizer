import type { Rule } from '../data/rules';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const processImage = async (
  file: File, 
  rule: Rule, 
  customMaxKb?: number, 
  outputFormat: string = 'image/jpeg',
  customCrop: CropRect | null = null,
  rotation: number = 0,
  slateName?: string,
  slateDate?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maxKb = customMaxKb || rule.maxKb || 240;
    const targetBytes = maxKb * 1024;
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Handle custom crop source coordinates
      let srcX = 0;
      let srcY = 0;
      let srcWidth = img.width;
      let srcHeight = img.height;

      if (customCrop) {
        srcX = customCrop.x;
        srcY = customCrop.y;
        srcWidth = customCrop.width;
        srcHeight = customCrop.height;
      }

      // Calculate orientation logic
      const isRotated = rotation === 90 || rotation === 270;
      const actualSrcWidth = isRotated ? srcHeight : srcWidth;
      const actualSrcHeight = isRotated ? srcWidth : srcHeight;

      // Set default target to the crop's actual dimensions to avoid unnecessary upscaling
      let targetWidth = actualSrcWidth;
      let targetHeight = actualSrcHeight;

      // Resize if dimensions are explicitly specified by the exam rule
      if (rule.dimensions && rule.dimensions.unit === 'px') {
        targetWidth = rule.dimensions.width;
        targetHeight = rule.dimensions.height;
      }

      // Proportional resize to fit within target dimensions
      const scale = Math.min(targetWidth / actualSrcWidth, targetHeight / actualSrcHeight);
      const newWidth = Math.round(actualSrcWidth * scale);
      const newHeight = Math.round(actualSrcHeight * scale);

      // Adjust canvas to exactly match the scaled image to avoid empty padding
      canvas.width = newWidth;
      canvas.height = newHeight;

      // CRITICAL: Ensure high-quality downscaling to prevent pixelation/aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply a subtle sharpness and contrast boost to counteract compression softness
      ctx.filter = 'contrast(102%) saturate(102%)';

      // Fill background if required
      if (rule.bgColorHex) {
        ctx.fillStyle = rule.bgColorHex;
        ctx.fillRect(0, 0, newWidth, newHeight);
      }

      // Apply rotation transformation
      ctx.save();
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // MULTI-STEP DOWNSCALING:
      // When shrinking an image significantly, browsers often blur it heavily.
      // Downscaling in steps of 50% preserves maximum optical sharpness.
      let currentDrawCanvas = document.createElement('canvas');
      let currentDrawCtx = currentDrawCanvas.getContext('2d');
      
      let curW = srcWidth;
      let curH = srcHeight;
      currentDrawCanvas.width = curW;
      currentDrawCanvas.height = curH;
      currentDrawCtx?.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, curW, curH);

      while (curW * 0.5 > (isRotated ? newHeight : newWidth)) {
        curW = Math.round(curW * 0.5);
        curH = Math.round(curH * 0.5);
        const stepCanvas = document.createElement('canvas');
        stepCanvas.width = curW;
        stepCanvas.height = curH;
        const stepCtx = stepCanvas.getContext('2d');
        stepCtx?.drawImage(currentDrawCanvas, 0, 0, curW, curH);
        currentDrawCanvas = stepCanvas;
      }

      // Final precise draw
      ctx.drawImage(
        currentDrawCanvas,
        0, 0, curW, curH, // Source rect from step-down canvas
        isRotated ? -newHeight / 2 : -newWidth / 2, // Dest X
        isRotated ? -newWidth / 2 : -newHeight / 2, // Dest Y
        isRotated ? newHeight : newWidth, // Dest Width
        isRotated ? newWidth : newHeight  // Dest Height
      );
      
      ctx.restore();

      // -------------------------------------------------------------
      // DRAW PHOTO SLATE (Name & Date at bottom)
      // -------------------------------------------------------------
      if (slateName || slateDate) {
        // Reserve bottom 15% of the image for the slate
        const slateHeight = Math.round(newHeight * 0.15);
        const slateY = newHeight - slateHeight;
        
        // Draw solid white box
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, slateY, newWidth, slateHeight);
        
        // Set up text styling
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dynamically scale font sizes based on slate height
        const mainFontSize = Math.max(12, Math.round(slateHeight * 0.4));
        const subFontSize = Math.max(10, Math.round(slateHeight * 0.3));
        
        if (slateName && slateDate) {
          // Draw both
          ctx.font = `bold ${mainFontSize}px sans-serif`;
          ctx.fillText(slateName, newWidth / 2, slateY + (slateHeight * 0.35));
          
          ctx.font = `${subFontSize}px sans-serif`;
          ctx.fillText(slateDate, newWidth / 2, slateY + (slateHeight * 0.75));
        } else if (slateName) {
          // Draw name only, centered
          ctx.font = `bold ${mainFontSize}px sans-serif`;
          ctx.fillText(slateName, newWidth / 2, slateY + (slateHeight * 0.5));
        } else if (slateDate) {
          // Draw date only, centered
          ctx.font = `bold ${mainFontSize}px sans-serif`;
          ctx.fillText(slateDate, newWidth / 2, slateY + (slateHeight * 0.5));
        }
      }

      // Fast Path: If highest quality fits within limits, use it immediately
      const maxQualityDataUrl = canvas.toDataURL(outputFormat, 1.0);
      const maxQualityBytes = Math.round((maxQualityDataUrl.length * 3) / 4);
      
      if (maxQualityBytes <= targetBytes) {
        return resolve(maxQualityDataUrl);
      }

      // -------------------------------------------------------------
      // PNG FORMAT: Lossless Dimension Shrinking
      // -------------------------------------------------------------
      if (outputFormat === 'image/png') {
        let currentWidth = newWidth;
        let currentHeight = newHeight;
        let currentDataUrl = maxQualityDataUrl;
        let currentBytes = maxQualityBytes;

        const shrinkPng = (iterationsLeft: number) => {
          if (iterationsLeft <= 0 || currentBytes <= targetBytes || currentWidth < 50) {
            return resolve(currentDataUrl); // Return best effort PNG
          }

          // Shrink physical dimensions by 10% to reduce lossless file size
          currentWidth = Math.round(currentWidth * 0.9);
          currentHeight = Math.round(currentHeight * 0.9);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = currentWidth;
          tempCanvas.height = currentHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            if (rule.bgColorHex) {
              tempCtx.fillStyle = rule.bgColorHex;
              tempCtx.fillRect(0, 0, currentWidth, currentHeight);
            }
            
            // Draw from the ALREADY OPTIMIZED main canvas.
            // Since we shrink by 10% each time, single-step draw from the optimized canvas 
            // is perfectly sharp, whereas drawing from the raw image was causing massive blur.
            tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight, 0, 0, currentWidth, currentHeight);

            currentDataUrl = tempCanvas.toDataURL('image/png');
            currentBytes = Math.round((currentDataUrl.length * 3) / 4);
          }
          
          shrinkPng(iterationsLeft - 1);
        };
        
        shrinkPng(15); // Up to 15 iterations (shrinks to ~20% of original dimensions)
        return;
      }

      // -------------------------------------------------------------
      // JPEG / WEBP FORMAT: Binary Search Quality Compression
      // -------------------------------------------------------------
      let minQ = 0.0;
      let maxQ = 1.0;
      let bestQ = 0.8;
      let bestDataUrl = canvas.toDataURL(outputFormat, bestQ);
      
      const compress = (iterationsLeft: number) => {
        if (iterationsLeft <= 0) {
          resolve(bestDataUrl);
          return;
        }

        const midQ = (minQ + maxQ) / 2;
        const dataUrl = canvas.toDataURL(outputFormat, midQ);
        const bytes = Math.round((dataUrl.length * 3) / 4); // base64 approx size

        if (bytes <= targetBytes) {
          bestQ = midQ;
          bestDataUrl = dataUrl;
          minQ = midQ; // try to squeeze more quality since we are under limit
        } else {
          maxQ = midQ; // too big, lower quality
        }
        
        compress(iterationsLeft - 1);
      };

      compress(8); // 8 iterations for binary search precision
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = objectUrl;
  });
}
