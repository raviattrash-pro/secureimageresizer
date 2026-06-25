import React, { useState, useEffect } from 'react';
import './App.css';
import { categories } from './data/categories';
import type { Category } from './data/categories';
import { rules } from './data/rules';
import type { Rule } from './data/rules';
import { ExamSearchInput } from './components/ExamSearchInput';
import { UniversalDropzone } from './components/UniversalDropzone';
import { ResultPreview } from './components/ResultPreview';
import { ImageEditor } from './components/ImageEditor';
import { processImage } from './utils/imageProcessor';
import type { CropRect } from './utils/imageProcessor';
import { convertImageToPdf, compressPdf, convertImagesToPdf } from './utils/pdfProcessor';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    () => categories.find(c => c.id === 'general_passport') || null
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customKbTarget, setCustomKbTarget] = useState<number | ''>('');
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg');
  const [slateName, setSlateName] = useState<string>('');
  const [slateDate, setSlateDate] = useState<string>('');
  const [processedResult, setProcessedResult] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Theme Management
  const [theme, setTheme] = useState<'system' | 'light' | 'dark' | 'zen'>('system');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'zen'>('dark');
  const [deviceIcon, setDeviceIcon] = useState<string>('💻');
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Detect System Theme & Device Type
  useEffect(() => {
    // Device icon logic
    const updateDeviceIcon = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceIcon('📱');
      else if (width >= 768 && width <= 1024) setDeviceIcon('💻');
      else setDeviceIcon('🖥️');
    };
    
    updateDeviceIcon();
    window.addEventListener('resize', updateDeviceIcon);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      if (theme === 'system') {
        const isSystemDark = mediaQuery.matches;
        setActiveTheme(isSystemDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
      } else {
        setActiveTheme(theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme();
    
    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
      window.removeEventListener('resize', updateDeviceIcon);
    };
  }, [theme]);

  const handleFilesAccepted = (files: File[]) => {
    setSelectedFiles(files);
    setProcessedResult(null);
  };

  const handleProcess = async (
    customCrop: CropRect | null = null, 
    rotation: number = 0,
    customBgColor?: string,
    fileOverride?: File
  ) => {
    if (selectedFiles.length === 0 || !selectedCategory) return;
    setIsProcessing(true);
    
    const totalTargetKb = customKbTarget !== '' ? customKbTarget : rules[selectedCategory.id]?.maxKb;
    const baseRule = rules[selectedCategory.id];
    const rule = customBgColor ? { ...baseRule, bgColorHex: customBgColor } : baseRule;
    
    try {
      const isPdfOutput = outputFormat === 'application/pdf';
      const isMultiImageToPdf = isPdfOutput && selectedFiles.every(f => f.type.startsWith('image/'));

      if (isMultiImageToPdf) {
        // Handle single or multiple images -> PDF
        let targetKbPerImage = totalTargetKb ? Math.floor(totalTargetKb / selectedFiles.length) : undefined;
        
        // PDF structure adds overhead. If they want 50KB total for 10 pages, that's impossible.
        if (targetKbPerImage && targetKbPerImage < 20 && selectedFiles.length > 1) {
          const userWantsToProceed = window.confirm(
            `Extreme Compression Warning!\n\nYou are trying to squeeze ${selectedFiles.length} pages into a ${totalTargetKb} KB limit. ` +
            `This means each page will be aggressively crushed to roughly ${targetKbPerImage} KB, which will result in very poor, pixelated image quality.\n\n` +
            `Do you want to proceed anyway? (For better quality, increase the Target File Size limit).`
          );
          if (!userWantsToProceed) {
            setIsProcessing(false);
            return;
          }
        }
        
        const processedImageUrls = [];
        for (let i = 0; i < selectedFiles.length; i++) {
          const isFirstFile = i === 0;
          const fileToProcess = (isFirstFile && fileOverride) ? fileOverride : selectedFiles[i];
          
          const resultUrl = await processImage(
            fileToProcess, 
            rule, 
            targetKbPerImage, 
            'image/jpeg', // Force internal compression to JPEG before wrapping in PDF
            (isFirstFile && selectedFiles.length === 1) ? customCrop : null,
            (isFirstFile && selectedFiles.length === 1) ? rotation : 0,
            slateName || undefined,
            slateDate || undefined
          );
          processedImageUrls.push(resultUrl);
        }
        
        const finalPdfUrl = await convertImagesToPdf(processedImageUrls);
        setProcessedResult(finalPdfUrl);
        
      } else if (selectedFiles.length === 1) {
        // Standard single file processing
        const file = fileOverride || selectedFiles[0];
        
        if (file.type.startsWith('image/')) {
          const resultUrl = await processImage(
            file, 
            rule, 
            totalTargetKb as number, 
            outputFormat,
            customCrop,
            rotation,
            slateName || undefined,
            slateDate || undefined
          );
          setProcessedResult(resultUrl);
        } else if (file.type === 'application/pdf') {
          const resultUrl = await compressPdf(file);
          const blob = await fetch(resultUrl).then(r => r.blob());
          const resultKb = Math.round(blob.size / 1024);
          
          if (totalTargetKb && resultKb > totalTargetKb + 5) {
            alert(
              `Notice: The PDF could only be reduced to ${resultKb} KB.\n\n` +
              `Since PDFs are complex containers, compressing existing PDF files deeply in the browser is limited.\n\n` +
              `PRO TIP: To hit exactly ${totalTargetKb} KB, upload the original IMAGES (JPEG/PNG) of the document, and choose "PDF Document" from the Output Format dropdown. The app will aggressively compress the images and perfectly wrap them in a tiny PDF!`
            );
          }
          setProcessedResult(resultUrl);
        } else {
          alert("Unsupported file type.");
        }
      } else {
        alert("You can only process multiple files if they are Images and you select 'PDF Document' output format.");
      }
    } catch (e: any) {
      alert("Error processing file: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setProcessedResult(null);
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Secure Document Auto-Resizer</h1>
        <p className="subtitle">100% In-Browser. Zero Data Collection.</p>
        
        <div className="theme-toggle">
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            title="Light Mode"
          >
            ☀️
          </button>
          <button 
            className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => setTheme('system')}
            title="System Auto"
          >
            {deviceIcon}
          </button>
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            title="Dark Mode"
          >
            🌙
          </button>
          <button 
            className={`theme-btn ${theme === 'zen' ? 'active' : ''}`}
            onClick={() => setTheme('zen')}
            title="Zen Mode"
          >
            🌅
          </button>
          {deferredPrompt && (
            <button 
              className="theme-btn install-btn"
              onClick={handleInstallClick}
              title="Install App"
              style={{ color: '#E86A33', fontWeight: 'bold' }}
            >
              ⬇️
            </button>
          )}
        </div>
      </div>
      
      <main className="main-content">
        <ExamSearchInput onSelect={(cat) => {
          setSelectedCategory(cat);
          resetAll();
        }} />
        
        {selectedCategory && !processedResult && (
          <div className="selected-info">
            <h3>Selected: {selectedCategory.name}</h3>
            <p>Type: <span className="tag">{selectedCategory.type}</span></p>
            
            <div className="custom-size-container">
              <label htmlFor="customKb">Optional: Target File Size (Max KB)</label>
              <input 
                id="customKb"
                type="number" 
                placeholder={`Default is ${rules[selectedCategory.id]?.maxKb} KB. Enter a number to override.`}
                value={customKbTarget}
                onChange={(e) => setCustomKbTarget(e.target.value ? Number(e.target.value) : '')}
                min={10}
              />
            </div>
            
            <div className="custom-size-container">
              <label htmlFor="outputFormat">Output Format:</label>
              <select 
                id="outputFormat" 
                value={outputFormat} 
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="image/jpeg">JPEG (Best for strict size limits)</option>
                <option value="image/webp">WebP (Best Quality/Size ratio)</option>
                <option value="image/png">PNG (Lossless - May exceed size limit)</option>
                <option value="application/pdf">PDF Document (Converts image to PDF)</option>
              </select>
            </div>
            
            {selectedCategory.type === 'passport' && (
              <div className="custom-size-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="slateName">Optional: Name on Photo</label>
                  <input 
                    id="slateName"
                    type="text" 
                    placeholder="e.g. Rahul Kumar"
                    value={slateName}
                    onChange={(e) => setSlateName(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="slateDate">Optional: Date on Photo</label>
                  <input 
                    id="slateDate"
                    type="date" 
                    value={slateDate}
                    onChange={(e) => setSlateDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <UniversalDropzone 
              onFilesAccepted={handleFilesAccepted} 
              acceptedFormats={rules[selectedCategory.id]?.allowedFormats || []}
              multiple={outputFormat === 'application/pdf'}
            />

            {selectedFiles.length > 0 && (
              <div className="action-area">
                <p className="file-info">Ready to process: <strong>{selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files`}</strong></p>
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  {selectedFiles.length === 1 && (
                    <button 
                      className="process-button reset-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      Crop & Rotate First
                    </button>
                  )}
                  <button 
                    className={`process-button ${isProcessing ? 'processing' : ''}`}
                    onClick={() => handleProcess()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Document Securely'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isEditing && selectedFiles.length === 1 && (
          <ImageEditor 
            imageUrl={URL.createObjectURL(selectedFiles[0])}
            onSave={async (crop, rotation, customBgColor, strippedFile) => {
              setIsEditing(false);
              await handleProcess(crop, rotation, customBgColor, strippedFile);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {processedResult && selectedFiles.length > 0 && !isEditing && (
          <ResultPreview 
            originalFile={selectedFiles[0]} 
            processedDataUrl={processedResult} 
            isPdfOutput={outputFormat === 'application/pdf' || selectedFiles[0].type === 'application/pdf'}
            onReset={resetAll}
            onAdjust={() => setIsEditing(true)}
          />
        )}
      </main>
      <Analytics />
    </div>
  );
}

export default App;
