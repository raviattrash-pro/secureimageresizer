import { PDFDocument } from 'pdf-lib';

export async function convertImageToPdf(imageDataUrl: string): Promise<string> {
  return convertImagesToPdf([imageDataUrl]);
}

export async function convertImagesToPdf(imageDataUrls: string[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  
  for (const imageDataUrl of imageDataUrls) {
    const isPng = imageDataUrl.startsWith('data:image/png');
    const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    
    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export async function compressPdf(file: File): Promise<string> {
  // Basic pass: Load and save to strip some metadata/garbage
  // Deep compression requires rendering pages to images which needs pdf.js
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
