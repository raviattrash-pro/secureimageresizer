import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import { removeBackground } from '@imgly/background-removal';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageEditor.css';
import type { CropRect } from '../utils/imageProcessor';

interface Props {
  imageUrl: string;
  onSave: (crop: CropRect | null, rotation: number, customBgColor?: string, strippedFile?: File) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onSave, onCancel }: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [transparentImageUrl, setTransparentImageUrl] = useState<string | null>(null);
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [useCustomBg, setUseCustomBg] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  const handleRemoveBackground = async () => {
    if (isRemovingBg || transparentImageUrl) return;
    try {
      setIsRemovingBg(true);
      const blob = await removeBackground(imageUrl);
      const url = URL.createObjectURL(blob);
      setTransparentImageUrl(url);
      setUseCustomBg(true); // Automatically turn on the custom BG when stripped
    } catch (error) {
      alert("Failed to remove background: " + error);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleSave = async () => {
    const finalBgColor = useCustomBg ? customBgColor : undefined;
    
    let strippedFile: File | undefined = undefined;
    if (transparentImageUrl) {
      const blob = await fetch(transparentImageUrl).then(r => r.blob());
      strippedFile = new File([blob], 'stripped_image.png', { type: 'image/png' });
    }
    
    if (completedCrop && completedCrop.width && completedCrop.height && imgRef.current) {
      // Calculate scaling factor between rendered CSS size and actual image resolution
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      onSave({
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY)
      }, rotation, finalBgColor, strippedFile);
    } else {
      onSave(null, rotation, finalBgColor, strippedFile); // Just rotate/bg, no crop
    }
  };

  return (
    <div className="editor-overlay">
      <div className="editor-modal">
        <h2>Adjust Image & Background</h2>
        <div className="editor-controls" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center'}}>
          <button onClick={handleRotate} className="rotate-btn">
            ↻ Rotate 90°
          </button>
          
          <button 
            onClick={handleRemoveBackground} 
            className={`process-button ${isRemovingBg ? 'processing' : ''}`}
            disabled={isRemovingBg || !!transparentImageUrl}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            {isRemovingBg ? '⏳ AI Thinking (~40MB Download)...' : transparentImageUrl ? '✅ Background Removed' : '🪄 Remove Background'}
          </button>
          
          {transparentImageUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="bgColor">Background:</label>
              <input 
                id="bgColor"
                type="color" 
                value={customBgColor} 
                onChange={(e) => setCustomBgColor(e.target.value)} 
                title="Choose custom background color"
              />
              <label>
                <input 
                  type="checkbox" 
                  checked={useCustomBg} 
                  onChange={(e) => setUseCustomBg(e.target.checked)} 
                /> Enable Color
              </label>
            </div>
          )}
        </div>
        
        <div className="crop-scroll-container">
            <div className="crop-transform-wrapper" style={{ transform: `rotate(${rotation}deg)` }}>
              <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                <img 
                  ref={imgRef} 
                  src={transparentImageUrl || imageUrl} 
                  alt="Crop preview" 
                  style={{ 
                    maxHeight: '60vh', 
                    maxWidth: '100%',
                    backgroundColor: useCustomBg ? customBgColor : 'transparent'
                  }} 
                />
              </ReactCrop>
            </div>
        </div>

        <div className="editor-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Apply & Process</button>
        </div>
      </div>
    </div>
  );
}
