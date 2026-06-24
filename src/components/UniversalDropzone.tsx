import React, { useCallback, useState } from 'react';
import './UniversalDropzone.css';

interface Props {
  onFilesAccepted: (files: File[]) => void;
  acceptedFormats: string[]; // e.g., ['image/jpeg', 'image/png', 'application/pdf']
  multiple?: boolean;
}

export function UniversalDropzone({ onFilesAccepted, acceptedFormats, multiple = false }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndAccept = (files: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const invalidTypes = new Set<string>();

    Array.from(files).forEach(file => {
      if (acceptedFormats.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidTypes.add(file.type);
      }
    });

    if (invalidTypes.size > 0) {
      setError(`Some files were ignored due to invalid type. Please upload: ${acceptedFormats.join(', ')}`);
    }

    if (validFiles.length > 0) {
      if (!multiple && validFiles.length > 1) {
        onFilesAccepted([validFiles[0]]); // Accept only the first one
      } else {
        onFilesAccepted(validFiles);
      }
    } else if (files.length > 0) {
      setError(`Invalid file type. Please upload: ${acceptedFormats.join(', ')}`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAccept(e.dataTransfer.files);
    }
  }, [acceptedFormats, onFilesAccepted, multiple]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAccept(e.target.files);
    }
  };

  return (
    <div className="dropzone-wrapper">
      <div 
        className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="dropzone-text">Drag & Drop your file here</p>
          <p className="dropzone-subtext">or click to browse</p>
          <input 
            type="file" 
            className="file-input" 
            accept={acceptedFormats.join(',')}
            multiple={multiple}
            onChange={handleFileInput}
          />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
