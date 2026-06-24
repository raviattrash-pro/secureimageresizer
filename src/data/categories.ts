export type CategoryType = 'passport' | 'signature' | 'document';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  region?: string;
  group?: string;
}

export const categories: Category[] = [
  // UPSC
  { id: 'upsc_cse_photo', name: 'UPSC CSE (IAS/IPS) Photo', type: 'passport', region: 'IN', group: 'UPSC' },
  { id: 'upsc_cse_sig', name: 'UPSC CSE (IAS/IPS) Signature', type: 'signature', region: 'IN', group: 'UPSC' },
  { id: 'upsc_nda_photo', name: 'UPSC NDA/CDS Photo', type: 'passport', region: 'IN', group: 'UPSC' },
  
  // SSC
  { id: 'ssc_cgl_photo', name: 'SSC CGL/CHSL Photo', type: 'passport', region: 'IN', group: 'SSC' },
  { id: 'ssc_cgl_sig', name: 'SSC CGL/CHSL Signature', type: 'signature', region: 'IN', group: 'SSC' },
  
  // Banking & Insurance
  { id: 'ibps_po_photo', name: 'IBPS PO/Clerk Photo', type: 'passport', region: 'IN', group: 'Banking' },
  { id: 'ibps_po_sig', name: 'IBPS PO/Clerk Signature', type: 'signature', region: 'IN', group: 'Banking' },
  { id: 'sbi_po_photo', name: 'SBI PO/Clerk Photo', type: 'passport', region: 'IN', group: 'Banking' },
  
  // Railways
  { id: 'rrb_ntpc_photo', name: 'RRB NTPC/Group D Photo', type: 'passport', region: 'IN', group: 'RRB' },
  { id: 'rrb_ntpc_sig', name: 'RRB NTPC/Group D Signature', type: 'signature', region: 'IN', group: 'RRB' },
  
  // Defence
  { id: 'afcat_photo', name: 'AFCAT Photo', type: 'passport', region: 'IN', group: 'Defence' },
  { id: 'afcat_sig', name: 'AFCAT Signature', type: 'signature', region: 'IN', group: 'Defence' },

  // Teaching
  { id: 'ctet_photo', name: 'CTET Photo', type: 'passport', region: 'IN', group: 'Teaching' },
  { id: 'ugc_net_photo', name: 'UGC NET Photo', type: 'passport', region: 'IN', group: 'Teaching' },

  // General Purpose Tools
  { id: 'general_passport', name: 'General Passport Photo (Standard)', type: 'passport', group: 'General' },
  { id: 'general_signature', name: 'General Signature Resizer', type: 'signature', group: 'General' },
  { id: 'general_pdf_compress', name: 'General Document/PDF Compressor', type: 'document', group: 'General' },

  // Visas
  { id: 'us_visa_div', name: 'US Diversity Visa', type: 'passport', region: 'US', group: 'Visa' },
];
