import React, { useState, useEffect } from 'react';
import './ResultPreview.css';

interface Props {
  originalFile: File;
  processedDataUrl: string;
  isPdfOutput?: boolean;
  onReset: () => void;
  onAdjust: () => void;
}

export function ResultPreview({ originalFile, processedDataUrl, isPdfOutput, onReset, onAdjust }: Props) {
  const [processedSizeKb, setProcessedSizeKb] = useState<number | null>(null);
  
  const originalSizeKb = Math.round(originalFile.size / 1024);

  useEffect(() => {
    if (processedDataUrl.startsWith('blob:')) {
      fetch(processedDataUrl)
        .then(res => res.blob())
        .then(blob => setProcessedSizeKb(Math.round(blob.size / 1024)));
    } else if (processedDataUrl.startsWith('data:')) {
      const bytes = Math.round((processedDataUrl.length * 3) / 4);
      setProcessedSizeKb(Math.round(bytes / 1024));
    }
  }, [processedDataUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = processedDataUrl;
    
    // Determine correct extension based on data URL or PDF output
    let extension = 'jpg';
    if (isPdfOutput) {
      extension = 'pdf';
    } else if (processedDataUrl.startsWith('data:image/png')) {
      extension = 'png';
    } else if (processedDataUrl.startsWith('data:image/webp')) {
      extension = 'webp';
    }

    // Just a clean filename without replacing the old extension if we're changing types
    const baseName = originalFile.name.replace(/\.[^/.]+$/, ""); 
    link.download = `compliant_${baseName}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOriginalPdf = originalFile.type === 'application/pdf';

  return (
    <div className="result-container">
      <h2>Success! Document Processed</h2>
      <div className="preview-grid">
        <div className="preview-card">
          <h3>Original</h3>
          {isOriginalPdf ? (
            <div className="pdf-placeholder">PDF Document</div>
          ) : (
            <img src={URL.createObjectURL(originalFile)} alt="Original" />
          )}
          <p>Size: {originalSizeKb} KB</p>
        </div>
        <div className="preview-card processed">
          <h3>Processed & Compliant</h3>
          {isPdfOutput ? (
            <iframe src={processedDataUrl} className="pdf-preview" title="Processed PDF" />
          ) : (
            <img src={processedDataUrl} alt="Processed" />
          )}
          <p className="success-text">
            Size: {processedSizeKb !== null ? `${processedSizeKb} KB` : 'Calculating...'}
          </p>
        </div>
      </div>
      
      <div className="result-actions">
        <button className="download-btn" onClick={handleDownload}>
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Securely
        </button>
        {!isPdfOutput && !isOriginalPdf && (
          <button className="reset-btn" onClick={onAdjust}>Crop & Adjust</button>
        )}
        <button className="reset-btn" onClick={onReset}>Process New File</button>
      </div>
    </div>
  );
}
