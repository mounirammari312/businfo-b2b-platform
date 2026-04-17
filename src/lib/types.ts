// ============================================================================
// BUSINFO B2B Marketplace — Complete TypeScript Types
// Matches Supabase database schema at supabase/schema.sql
// ============================================================================

// ============================================================================
// Generic / Utility Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess {
  success: true;
  message?: string;
}

// ============================================================================
// User & Profile Types
// ============================================================================

export type UserRole = 'admin' | 'supplier' | 'buyer';
export type Locale = 'ar' | 'fr';
export type Currency = 'DZD' | 'EUR' | 'USD';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  locale: Locale;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'supplier' | 'user' | 'buyer';
  supplierStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  supplierProfile?: {
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    category: string;
    logoUrl: string;
    coverUrl: string;
    address: string;
    addressEn: string;
    contact: { phone: string; whatsapp: string; email: string };
    badge: 'gold' | 'blue' | 'none';
  };
}

// ============================================================================
// Supplier Types
// ============================================================================

export type SupplierStatus = 'active' | 'suspended';

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  category: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  addressEn: string | null;
  city: string | null;
  country: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  totalSales: number;
  views: number;
  isVerified: boolean;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierWithExtras extends Supplier {
  badges?: SupplierBadge[];
}

// Legacy SupplierAd (keep for backward compat)
export interface SupplierAd {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierUsername: string;
  title: string;
  description: string;
  placement: 'top' | 'featured' | 'highlighted';
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'paused';
  budget: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate?: string;
  adminNote?: string;
  createdAt: string;
}

// Legacy types for store compatibility
export interface Message {
  id: string;
  fromUsername: string;
  fromDisplayName: string;
  toUsername: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  nameEn: string;
  price: number;
  currency: string;
  description: string;
  descriptionEn: string;
  imageUrl: string;
  category: string;
  inStock: boolean;
  unit: string;
  minOrder: number;
  createdAt: string;
}

export interface AppState {
  users: UserProfile[];
  suppliers: Supplier[];
  products: Product[];
  messages: Message[];
  ads: SupplierAd[];
  addUser: (user: UserProfile) => void;
  updateUser: (id: string, data: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;
  getUserByUsername: (username: string) => UserProfile | undefined;
  getUserById: (id: string) => UserProfile | undefined;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductsBySupplier: (supplierId: string) => Product[];
  addMessage: (message: Message) => void;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  getMessagesByUsername: (username: string) => Message[];
  addAd: (ad: SupplierAd) => void;
  updateAd: (id: string, data: Partial<SupplierAd>) => void;
  deleteAd: (id: string) => void;
  getAdsBySupplier: (supplierId: string) => SupplierAd[];
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  description: string | null;
  descriptionEn: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  subcategoryCount?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// Product Types (Schema-matched)
// ============================================================================

export type ProductStatus = 'active' | 'draft' | 'archived';
export type VariationType = 'size' | 'color' | 'material' | 'weight';

export interface ProductRow {
  id: string;
  supplierId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  currency: Currency;
  categoryId: string | null;
  subcategoryId: string | null;
  minOrder: number;
  unit: string;
  inStock: boolean;
  stockQuantity: number | null;
  isFeatured: boolean;
  views: number;
  totalSales: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithDetails extends ProductRow {
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl' | 'city' | 'isVerified'>;
  category?: Pick<Category, 'id' | 'name' | 'nameEn' | 'slug'> | null;
  subcategory?: Pick<Subcategory, 'id' | 'name' | 'nameEn' | 'slug'> | null;
  images: ProductImage[];
  variations: ProductVariation[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVariation {
  id: string;
  productId: string;
  variationType: VariationType;
  variationValue: string;
  sku: string | null;
  priceOverride: number | null;
  stockQuantity: number | null;
  createdAt: string;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  buyerId: string;
  supplierId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: Currency;
  notes: string | null;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  buyer?: Pick<Profile, 'id' | 'displayName' | 'email'>;
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl'>;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variationId: string | null;
  createdAt: string;
}

// ============================================================================
// Quote Types
// ============================================================================

export type QuoteStatus = 'open' | 'replied' | 'closed' | 'expired';
export type ReplyStatus = 'pending' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  buyerId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  quantity: number | null;
  unit: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: Currency;
  deadline: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteWithDetails extends Quote {
  buyer?: Pick<Profile, 'id' | 'displayName'>;
  category?: Pick<Category, 'id' | 'name' | 'nameEn'> | null;
  replies?: QuoteReply[];
  replyCount?: number;
}

export interface QuoteReply {
  id: string;
  quoteId: string;
  supplierId: string;
  pricePerUnit: number | null;
  currency: Currency;
  message: string | null;
  deliveryTime: string | null;
  status: ReplyStatus;
  createdAt: string;
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl'>;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  productId: string | null;
  supplierId: string | null;
  buyerId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isPublished: boolean;
  createdAt: string;
  buyer?: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface AverageRating {
  avg: number;
  count: number;
}

// ============================================================================
// Favorites Types
// ============================================================================

export interface Favorite {
  id: string;
  userId: string;
  productId: string | null;
  supplierId: string | null;
  createdAt: string;
  product?: Pick<ProductRow, 'id' | 'name' | 'nameEn' | 'price' | 'currency'> & { primaryImage: string | null };
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl' | 'city' | 'rating' | 'reviewCount'>;
}

// ============================================================================
// Messages Types (Schema-matched)
// ============================================================================

export type MessageType = 'product_inquiry' | 'badge_request' | 'ad_request' | 'general';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  messageType: MessageType;
  relatedId: string | null;
  createdAt: string;
  fromUser?: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
  toUser?: Pick<Profile, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface Conversation {
  id: string;
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  subject: string | null;
  messageType: MessageType;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'order' | 'quote' | 'message' | 'badge' | 'ad' | 'review' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: NotificationType;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

// ============================================================================
// Badge Types
// ============================================================================

export type BadgeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface BadgeType {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface BadgeRequest {
  id: string;
  supplierId: string;
  badgeTypeId: string;
  status: BadgeRequestStatus;
  message: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl'>;
  badgeType?: BadgeType;
}

export interface SupplierBadge {
  id: string;
  supplierId: string;
  badgeTypeId: string;
  activatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  badgeType?: BadgeType;
}

// ============================================================================
// Ad Types
// ============================================================================

export type AdRequestStatus = 'pending' | 'active' | 'rejected' | 'expired';
export type PlacementType = 'banner' | 'featured' | 'product_boost' | 'category' | 'sidebar';

export interface AdType {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  placementType: PlacementType;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdRequest {
  id: string;
  supplierId: string;
  adTypeId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  targetUrl: string | null;
  status: AdRequestStatus;
  message: string | null;
  adminNote: string | null;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  supplier?: Pick<Supplier, 'id' | 'name' | 'nameEn' | 'logoUrl'>;
  adType?: AdType;
}

// ============================================================================
// Stats Types (Admin)
// ============================================================================

export interface PlatformStats {
  users: number;
  suppliers: number;
  products: number;
  orders: number;
  revenue: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface TopProduct {
  id: string;
  name: string;
  nameEn: string | null;
  totalSales: number;
  supplierName: string;
}

export interface TopSupplier {
  id: string;
  name: string;
  nameEn: string | null;
  totalSales: number;
  rating: number;
  productCount: number;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  supplierId?: string;
  status?: ProductStatus;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  page?: number;
  limit?: number;
  isFeatured?: boolean;
}

export interface SupplierFilters {
  category?: string;
  city?: string;
  search?: string;
  status?: SupplierStatus;
  sortBy?: 'newest' | 'rating' | 'products' | 'name';
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  buyerId?: string;
  supplierId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface QuoteFilters {
  buyerId?: string;
  supplierId?: string;
  status?: QuoteStatus;
  page?: number;
  limit?: number;
}

export interface ReviewFilters {
  productId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

export interface BadgeRequestFilters {
  supplierId?: string;
  status?: BadgeRequestStatus;
  page?: number;
  limit?: number;
}

export interface AdRequestFilters {
  supplierId?: string;
  status?: AdRequestStatus;
  page?: number;
  limit?: number;
}
