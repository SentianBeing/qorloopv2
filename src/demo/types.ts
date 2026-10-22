// Qorloop demo data model. Everything the UI shows is derived from DemoState.

export type MarketplaceId = 'talabat' | 'snoonu' | 'rafeeq' | 'keeta';
export type SourceId = 'erp' | MarketplaceId;

export const MARKETPLACE_IDS: MarketplaceId[] = ['talabat', 'snoonu', 'rafeeq', 'keeta'];

export interface Tenant {
  name: string;
  branch: string;
  country: string;
  currency: 'QAR';
  timezone: 'Asia/Qatar';
  erpName: string;
}

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  enabled: boolean;
  /** Default markup applied to the ERP selling price, in percent. */
  defaultMarkupPct: number;
}

/** A product in the Qorloop catalogue. */
export interface Product {
  id: string;
  barcode: string;
  sku: string;
  // ---- Owned by the ERP file (overwritten on every ERP upload) ----
  nameEn: string;
  brand: string;
  size: string;
  erpCategory: string;
  erpPrice: number; // selling price in QAR
  costPrice: number;
  erpStock: number;
  erpActive: boolean;
  /** False when the product was not in the latest full ERP file. */
  inLatestErpFile: boolean;
  // ---- Managed in Qorloop (never overwritten by the ERP) ----
  nameAr: string;
  categoryId: string;
  imageKey: string;
  /** 'new' = arrived in an ERP file and not yet activated for marketplaces. */
  status: 'active' | 'inactive' | 'new';
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

/** What a marketplace's latest file says about one product. */
export interface Listing {
  productId: string;
  marketplaceId: MarketplaceId;
  marketplaceProductId: string;
  price: number;
  available: boolean;
  /** Upload id of the marketplace file this row came from. */
  uploadId: string;
}

export interface MarkupOverride {
  productId: string;
  marketplaceId: MarketplaceId;
  markupPct: number;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface CategoryMapping {
  categoryId: string;
  marketplaceId: MarketplaceId;
  marketplaceCategory: string | null;
}

export interface UploadRecord {
  id: string;
  source: SourceId;
  fileName: string;
  fileSizeKb: number;
  contains: 'full' | 'partial';
  uploadedBy: string;
  uploadedAt: string; // ISO with +03:00
  status: 'applied' | 'needs_review' | 'discarded';
  templateId: string;
  summary: UploadSummary;
}

export interface UploadSummary {
  rowsRead: number;
  matched: number;
  newProducts: number;
  rowsWithErrors: number;
  priceChanges: number;
  stockChanges: number;
  missingFromFile: number;
}

export interface InputTemplate {
  id: string;
  source: SourceId;
  name: string;
  version: number;
  /** Qorloop field -> column header in the file. */
  fields: Record<string, string>;
  /** Headers that identify this layout. */
  signature: string[];
}

export interface OutputTemplate {
  marketplaceId: MarketplaceId;
  name: string;
  columns: string[];
  configured: boolean;
}

export interface GeneratedFile {
  id: string;
  marketplaceId: MarketplaceId;
  kind: 'stock' | 'price' | 'stock_price' | 'new_products';
  fileName: string;
  productCount: number;
  generatedBy: string;
  generatedAt: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  productId: string;
  source: string; // 'ERP (RetailOne)' | 'Talabat file' | 'Manual' ...
  field: string;
  oldValue: string;
  newValue: string;
  user: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Catalogue Manager' | 'Analyst';
  status: 'Active' | 'Invited';
}

export interface DemoState {
  version: number;
  /** Fixed demo clock (ISO, Asia/Qatar). Advances only when the demo says so. */
  now: string;
  tenant: Tenant;
  currentUser: TeamMember;
  team: TeamMember[];
  marketplaces: Marketplace[];
  categories: Category[];
  categoryMappings: CategoryMapping[];
  products: Product[];
  listings: Listing[];
  markups: MarkupOverride[];
  uploads: UploadRecord[];
  inputTemplates: InputTemplate[];
  outputTemplates: OutputTemplate[];
  generatedFiles: GeneratedFile[];
  activity: ActivityEntry[];
  settings: {
    priceTolerance: number; // QAR
    roundingStep: number; // QAR, e.g. 0.05
    stockThreshold: number; // available when erpStock > threshold
    staleHours: number;
  };
  /** Upload waiting for "Confirm and apply". */
  pendingReview: PendingReview | null;
  onboarding: {
    step: 1 | 2 | 3 | 4 | 5;
    completedAt: string | null;
  };
}

// ---------- Uploads & review ----------

/** One row read from an uploaded file, already mapped to Qorloop fields. */
export interface ErpRow {
  barcode: string;
  sku?: string;
  nameEn: string;
  nameAr?: string;
  brand?: string;
  size?: string;
  category?: string;
  price: number;
  cost?: number;
  stock: number;
  active: boolean;
}

export interface MarketplaceRow {
  marketplaceProductId: string;
  barcodes: string[];
  name: string;
  price: number;
  available: boolean;
}

export interface RowError {
  row: number;
  column: string;
  value: string;
  reason: string;
}

export interface ParsedUpload {
  source: SourceId;
  fileName: string;
  fileSizeKb: number;
  contains: 'full' | 'partial';
  templateId: string | null; // null = layout not recognised, needs mapping
  headers: string[];
  erpRows?: ErpRow[];
  marketplaceRows?: MarketplaceRow[];
  errors: RowError[];
  rowsRead: number;
}

export interface PriceChange { productId: string; barcode: string; nameEn: string; nameAr: string; oldValue: number; newValue: number }
export interface StockChange { productId: string; barcode: string; nameEn: string; nameAr: string; oldValue: number; newValue: number }
export interface AvailabilityChange { productId: string; barcode: string; nameEn: string; nameAr: string; oldValue: boolean | null; newValue: boolean }

export interface PendingReview {
  upload: ParsedUpload;
  summary: UploadSummary;
  priceChanges: PriceChange[];
  stockChanges: StockChange[];
  availabilityChanges: AvailabilityChange[];
  newProducts: ErpRow[];
  missing: { productId: string; barcode: string; nameEn: string }[];
  unmatched: MarketplaceRow[];
  errors: RowError[];
}
