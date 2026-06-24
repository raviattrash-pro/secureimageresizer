import type { CategoryType } from './categories';

export interface DimensionRule {
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'in';
}

export interface Rule {
  categoryId: string;
  dimensions?: DimensionRule; // PDF doesn't need specific dimensions
  dpi?: number;
  minKb?: number;
  maxKb: number;
  bgColorHex?: string; // e.g. #FFFFFF
  faceCentering?: {
    requireDetection: boolean;
    minHeightPercentage: number;
    maxHeightPercentage: number;
  };
  allowedFormats: string[];
}

const standardIndianPhoto: Omit<Rule, 'categoryId'> = {
  dimensions: { width: 350, height: 450, unit: 'px' }, // 3.5x4.5 cm roughly
  maxKb: 50,
  minKb: 20,
  bgColorHex: '#FFFFFF',
  faceCentering: {
    requireDetection: true,
    minHeightPercentage: 70,
    maxHeightPercentage: 80,
  },
  allowedFormats: ['image/jpeg', 'image/jpg'],
};

const standardIndianSig: Omit<Rule, 'categoryId'> = {
  dimensions: { width: 140, height: 60, unit: 'px' }, 
  maxKb: 20,
  minKb: 10,
  bgColorHex: '#FFFFFF',
  allowedFormats: ['image/jpeg', 'image/jpg'],
};

export const rules: Record<string, Rule> = {
  // UPSC
  upsc_cse_photo: { categoryId: 'upsc_cse_photo', ...standardIndianPhoto, maxKb: 300 },
  upsc_cse_sig: { categoryId: 'upsc_cse_sig', ...standardIndianSig },
  upsc_nda_photo: { categoryId: 'upsc_nda_photo', ...standardIndianPhoto },
  
  // SSC
  ssc_cgl_photo: { categoryId: 'ssc_cgl_photo', ...standardIndianPhoto },
  ssc_cgl_sig: { categoryId: 'ssc_cgl_sig', ...standardIndianSig },
  
  // Banking
  ibps_po_photo: { categoryId: 'ibps_po_photo', ...standardIndianPhoto },
  ibps_po_sig: { categoryId: 'ibps_po_sig', ...standardIndianSig },
  sbi_po_photo: { categoryId: 'sbi_po_photo', ...standardIndianPhoto },

  // Railways
  rrb_ntpc_photo: { categoryId: 'rrb_ntpc_photo', ...standardIndianPhoto },
  rrb_ntpc_sig: { categoryId: 'rrb_ntpc_sig', ...standardIndianSig },

  // Defence
  afcat_photo: { categoryId: 'afcat_photo', ...standardIndianPhoto },
  afcat_sig: { categoryId: 'afcat_sig', ...standardIndianSig },

  // Teaching
  ctet_photo: { categoryId: 'ctet_photo', ...standardIndianPhoto },
  ugc_net_photo: { categoryId: 'ugc_net_photo', ...standardIndianPhoto },

  // General Purpose Tools
  general_passport: {
    categoryId: 'general_passport',
    dimensions: { width: 600, height: 600, unit: 'px' }, // Standard 1:1 or 2x2 ratio
    dpi: 300,
    maxKb: 500, // Generous limit for general use
    bgColorHex: '#FFFFFF',
    faceCentering: {
      requireDetection: true,
      minHeightPercentage: 50,
      maxHeightPercentage: 69,
    },
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },
  general_signature: {
    categoryId: 'general_signature',
    dimensions: { width: 600, height: 200, unit: 'px' }, // 3:1 ratio
    maxKb: 200,
    bgColorHex: '#FFFFFF',
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },
  general_pdf_compress: {
    categoryId: 'general_pdf_compress',
    maxKb: 2000, // 2MB limit for general docs
    allowedFormats: ['application/pdf'],
  },

  // Visas
  us_visa_div: {
    categoryId: 'us_visa_div',
    dimensions: { width: 600, height: 600, unit: 'px' },
    dpi: 300,
    maxKb: 240,
    bgColorHex: '#FFFFFF',
    faceCentering: {
      requireDetection: true,
      minHeightPercentage: 50,
      maxHeightPercentage: 69,
    },
    allowedFormats: ['image/jpeg'],
  }
};
