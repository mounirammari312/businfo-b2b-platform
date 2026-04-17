import { supabase } from './supabase';
import type {
  // Legacy types (backward compat)
  UserProfile, Supplier, Product, Message, SupplierAd,
  // New schema-matched types
  Profile, Category, Subcategory, ProductRow, ProductWithDetails,
  ProductImage, ProductVariation, Order, OrderWithDetails, OrderItem,
  Quote, QuoteWithDetails, QuoteReply, Review, AverageRating,
  Favorite, ConversationMessage, Conversation, Notification,
  BadgeType, BadgeRequest, SupplierBadge, AdType, AdRequest,
  PlatformStats, MonthlyData, TopProduct, TopSupplier,
  PaginatedResponse, ProductFilters, SupplierFilters,
  OrderFilters, QuoteFilters, ReviewFilters,
  BadgeRequestFilters, AdRequestFilters,
} from './types';

// ============================================================================
// HELPER: Paginated query builder
// ============================================================================

async function paginatedQuery<T>(
  query: ReturnType<typeof supabase.from>,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<T>> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return {
    data: (data || []) as T[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

// ============================================================================
// PROFILES (Legacy backward compat + new functions)
// ============================================================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfileFromDb(data);
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  if (error || !data) return null;
  return mapProfileFromDb(data);
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapProfileFromDb);
}

export async function getProfileTyped(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfileTypedFromDb(data);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.supplierStatus !== undefined) dbUpdates.supplier_status = updates.supplierStatus;
  if (updates.supplierProfile) {
    dbUpdates.company_name = updates.supplierProfile.name;
    dbUpdates.company_name_en = updates.supplierProfile.nameEn;
    dbUpdates.description = updates.supplierProfile.description;
    dbUpdates.description_en = updates.supplierProfile.descriptionEn;
    dbUpdates.category = updates.supplierProfile.category;
    dbUpdates.logo_url = updates.supplierProfile.logoUrl;
    dbUpdates.cover_url = updates.supplierProfile.coverUrl;
    dbUpdates.address = updates.supplierProfile.address;
    dbUpdates.address_en = updates.supplierProfile.addressEn;
    dbUpdates.phone = updates.supplierProfile.contact.phone;
    dbUpdates.whatsapp = updates.supplierProfile.contact.whatsapp;
    dbUpdates.badge = updates.supplierProfile.badge;
  }
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId);
  return !error;
}

export async function deleteProfile(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  return !error;
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export async function getAllSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('rating', { ascending: false });
  if (error) return [];
  return (data || []).map(mapSupplierFromDb);
}

export async function getApprovedSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('status', 'approved')
    .order('rating', { ascending: false });
  if (error) return [];
  return (data || []).map(mapSupplierFromDb);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapSupplierFromDb(data);
}

export async function getSupplierByUserId(userId: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return mapSupplierFromDb(data);
}

export async function getSuppliers(filters: SupplierFilters = {}): Promise<PaginatedResponse<Supplier>> {
  const {
    category, city, search, status,
    sortBy = 'newest', page = 1, limit = 12,
  } = filters;

  let query = supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .eq('status', status || 'active');

  if (category) query = query.eq('category', category);
  if (city) query = query.eq('city', city);
  if (search) {
    query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`);
  }

  switch (sortBy) {
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'products':
      query = query.order('product_count', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  return paginatedQuery<Supplier>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapSupplierFromDb),
  }));
}

export async function getTopSuppliers(limit: number = 10): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('status', 'active')
    .order('rating', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map(mapSupplierFromDb);
}

export async function searchSuppliers(query: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,name_en.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(20);
  if (error) return [];
  return (data || []).map(mapSupplierFromDb);
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'productCount' | 'rating' | 'reviewCount' | 'views'>): Promise<Supplier | null> {
  const dbRow = {
    user_id: supplier.userId,
    name: supplier.name,
    name_en: supplier.nameEn,
    description: supplier.description,
    description_en: supplier.descriptionEn,
    category: supplier.category,
    logo_url: supplier.logoUrl,
    cover_url: supplier.coverUrl,
    address: supplier.address,
    address_en: supplier.addressEn,
    phone: supplier.contact?.phone,
    whatsapp: supplier.contact?.whatsapp,
    email: supplier.contact?.email,
    badge: supplier.badge,
    status: supplier.status,
    is_verified: supplier.isVerified,
  };
  const { data, error } = await supabase
    .from('suppliers')
    .insert(dbRow)
    .select()
    .single();
  if (error || !data) return null;
  return mapSupplierFromDb(data);
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.descriptionEn !== undefined) dbUpdates.description_en = updates.descriptionEn;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
  if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.addressEn !== undefined) dbUpdates.address_en = updates.addressEn;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.contact?.phone !== undefined) dbUpdates.phone = updates.contact.phone;
  if (updates.contact?.whatsapp !== undefined) dbUpdates.whatsapp = updates.contact.whatsapp;
  if (updates.contact?.email !== undefined) dbUpdates.email = updates.contact.email;
  if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.views !== undefined) dbUpdates.views = updates.views;

  const { error } = await supabase
    .from('suppliers')
    .update(dbUpdates)
    .eq('id', id);
  return !error;
}

export async function incrementSupplierViews(id: string): Promise<boolean> {
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('views')
    .eq('id', id)
    .single();
  if (!supplier) return false;
  const { error: updateError } = await supabase
    .from('suppliers')
    .update({ views: (supplier.views || 0) + 1, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !updateError;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  return !error;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*, subcategories(count)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data || []).map((row: Record<string, unknown>) => mapCategoryFromDb(row));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*, subcategories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return mapCategoryFromDb(data as Record<string, unknown>);
}

export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data || []).map(mapSubcategoryFromDb);
}

export async function createCategory(data: {
  name: string;
  nameEn: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  descriptionEn?: string;
  sortOrder?: number;
}): Promise<Category | null> {
  const { data: result, error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      name_en: data.nameEn,
      slug: data.slug,
      icon: data.icon || null,
      image_url: data.imageUrl || null,
      description: data.description || null,
      description_en: data.descriptionEn || null,
      sort_order: data.sortOrder || 0,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapCategoryFromDb(result);
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = {};
  if (data.name !== undefined) dbUpdates.name = data.name;
  if (data.nameEn !== undefined) dbUpdates.name_en = data.nameEn;
  if (data.slug !== undefined) dbUpdates.slug = data.slug;
  if (data.icon !== undefined) dbUpdates.icon = data.icon;
  if (data.imageUrl !== undefined) dbUpdates.image_url = data.imageUrl;
  if (data.description !== undefined) dbUpdates.description = data.description;
  if (data.descriptionEn !== undefined) dbUpdates.description_en = data.descriptionEn;
  if (data.sortOrder !== undefined) dbUpdates.sort_order = data.sortOrder;
  if (data.isActive !== undefined) dbUpdates.is_active = data.isActive;

  const { error } = await supabase
    .from('categories')
    .update(dbUpdates)
    .eq('id', id);
  return !error;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  return !error;
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapProductFromDb);
}

export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapProductFromDb);
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<ProductRow>> {
  const {
    category, subcategory, search, supplierId, status,
    sortBy = 'newest', page = 1, limit = 12, isFeatured,
  } = filters;

  let query = supabase
    .from('products')
    .select('*, suppliers(id, name, name_en, logo_url, city, is_verified)', { count: 'exact' })
    .eq('status', status || 'active');

  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (category) query = query.eq('category_id', category);
  if (subcategory) query = query.eq('subcategory_id', subcategory);
  if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`);
  }

  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('total_sales', { ascending: false });
      break;
    case 'rating':
      // For products we sort by views as a proxy for popularity
      query = query.order('views', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  return paginatedQuery<ProductRow>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapProductRowFromDb),
  }));
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      suppliers(id, name, name_en, logo_url, city, is_verified, rating),
      categories(id, name, name_en, slug),
      subcategories(id, name, name_en, slug)
    `)
    .eq('id', id)
    .single();
  if (error || !product) return null;

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .order('sort_order', { ascending: true });

  const { data: variations } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', id);

  return {
    ...mapProductRowFromDb(product),
    supplier: product.suppliers ? {
      id: product.suppliers.id,
      name: product.suppliers.name,
      nameEn: product.suppliers.name_en,
      logoUrl: product.suppliers.logo_url,
      city: product.suppliers.city,
      isVerified: product.suppliers.is_verified,
    } : undefined,
    category: product.categories ? {
      id: product.categories.id,
      name: product.categories.name,
      nameEn: product.categories.name_en,
      slug: product.categories.slug,
    } : null,
    subcategory: product.subcategories ? {
      id: product.subcategories.id,
      name: product.subcategories.name,
      nameEn: product.subcategories.name_en,
      slug: product.subcategories.slug,
    } : null,
    images: (images || []).map(mapProductImageFromDb),
    variations: (variations || []).map(mapProductVariationFromDb),
  } as ProductWithDetails;
}

export async function getFeaturedProducts(limit: number = 12): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, suppliers(id, name, name_en, logo_url, city, is_verified)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map(mapProductRowFromDb);
}

export async function getRelatedProducts(productId: string, categoryId: string | null): Promise<ProductRow[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*, suppliers(id, name, name_en, logo_url, city, is_verified)')
    .eq('status', 'active')
    .eq('category_id', categoryId)
    .neq('id', productId)
    .order('total_sales', { ascending: false })
    .limit(8);
  if (error) return [];
  return (data || []).map(mapProductRowFromDb);
}

export async function searchProducts(query: string, filters: ProductFilters = {}): Promise<PaginatedResponse<ProductRow>> {
  return getProducts({ ...filters, search: query });
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const dbRow = {
    supplier_id: product.supplierId,
    supplier_name: product.supplierName,
    name: product.name,
    name_en: product.nameEn,
    price: product.price,
    currency: product.currency,
    description: product.description,
    description_en: product.descriptionEn,
    image_url: product.imageUrl,
    category: product.category,
    in_stock: product.inStock,
    unit: product.unit,
    min_order: product.minOrder,
  };
  const { data, error } = await supabase
    .from('products')
    .insert(dbRow)
    .select()
    .single();
  if (error || !data) return null;
  return mapProductFromDb(data);
}

export async function createProductRow(data: {
  supplierId: string;
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  currency?: string;
  categoryId?: string;
  subcategoryId?: string;
  minOrder?: number;
  unit?: string;
  stockQuantity?: number;
  status?: string;
  isFeatured?: boolean;
}): Promise<ProductRow | null> {
  const { data: result, error } = await supabase
    .from('products')
    .insert({
      supplier_id: data.supplierId,
      name: data.name,
      name_en: data.nameEn || null,
      slug: data.slug,
      description: data.description || null,
      description_en: data.descriptionEn || null,
      price: data.price,
      currency: data.currency || 'DZD',
      category_id: data.categoryId || null,
      subcategory_id: data.subcategoryId || null,
      min_order: data.minOrder || 1,
      unit: data.unit || 'piece',
      stock_quantity: data.stockQuantity ?? null,
      in_stock: !data.stockQuantity || data.stockQuantity > 0,
      status: data.status || 'active',
      is_featured: data.isFeatured || false,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapProductRowFromDb(result);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.descriptionEn !== undefined) dbUpdates.description_en = updates.descriptionEn;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.minOrder !== undefined) dbUpdates.min_order = updates.minOrder;
  if (updates.supplierName !== undefined) dbUpdates.supplier_name = updates.supplierName;

  const { error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id);
  return !error;
}

export async function updateProductRow(id: string, updates: Partial<ProductRow>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.descriptionEn !== undefined) dbUpdates.description_en = updates.descriptionEn;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.subcategoryId !== undefined) dbUpdates.subcategory_id = updates.subcategoryId;
  if (updates.minOrder !== undefined) dbUpdates.min_order = updates.minOrder;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
  if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;

  const { error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id);
  return !error;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  return !error;
}

// Product Images
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data || []).map(mapProductImageFromDb);
}

export async function addProductImage(data: {
  productId: string;
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}): Promise<ProductImage | null> {
  const { data: result, error } = await supabase
    .from('product_images')
    .insert({
      product_id: data.productId,
      url: data.url,
      alt_text: data.altText || null,
      sort_order: data.sortOrder || 0,
      is_primary: data.isPrimary || false,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapProductImageFromDb(result);
}

export async function deleteProductImage(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', id);
  return !error;
}

// Product Variations
export async function getProductVariations(productId: string): Promise<ProductVariation[]> {
  const { data, error } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', productId);
  if (error) return [];
  return (data || []).map(mapProductVariationFromDb);
}

export async function addProductVariation(data: {
  productId: string;
  variationType: string;
  variationValue: string;
  sku?: string;
  priceOverride?: number;
  stockQuantity?: number;
}): Promise<ProductVariation | null> {
  const { data: result, error } = await supabase
    .from('product_variations')
    .insert({
      product_id: data.productId,
      variation_type: data.variationType,
      variation_value: data.variationValue,
      sku: data.sku || null,
      price_override: data.priceOverride || null,
      stock_quantity: data.stockQuantity ?? null,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapProductVariationFromDb(result);
}

export async function deleteProductVariation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('product_variations')
    .delete()
    .eq('id', id);
  return !error;
}

// ============================================================================
// ORDERS
// ============================================================================

export async function getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<OrderWithDetails>> {
  const { buyerId, supplierId, status, page = 1, limit = 10 } = filters;

  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, display_name, email),
      suppliers!orders_supplier_id_fkey(id, name, name_en, logo_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (buyerId) query = query.eq('buyer_id', buyerId);
  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (status) query = query.eq('status', status);

  return paginatedQuery<OrderWithDetails>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapOrderWithDetailsFromDb),
  }));
}

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_buyer_id_fkey(id, display_name, email),
      suppliers!orders_supplier_id_fkey(id, name, name_en, logo_url)
    `)
    .eq('id', id)
    .single();
  if (error || !order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  return {
    ...mapOrderFromDb(order),
    buyer: order.profiles ? { id: order.profiles.id, displayName: order.profiles.display_name, email: order.profiles.email } : undefined,
    supplier: order.suppliers ? { id: order.suppliers.id, name: order.suppliers.name, nameEn: order.suppliers.name_en, logoUrl: order.suppliers.logo_url } : undefined,
    items: (items || []).map(mapOrderItemFromDb),
  };
}

export async function createOrder(data: {
  buyerId: string;
  supplierId: string;
  items: { productId: string; productName: string; quantity: number; unitPrice: number; variationId?: string }[];
  notes?: string;
  shippingAddress?: string;
  currency?: string;
}): Promise<OrderWithDetails | null> {
  const totalAmount = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const currency = data.currency || 'DZD';

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: data.buyerId,
      supplier_id: data.supplierId,
      total_amount: totalAmount,
      currency,
      notes: data.notes || null,
      shipping_address: data.shippingAddress || null,
    })
    .select()
    .single();

  if (orderError || !order) return null;

  const orderItems = data.items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.unitPrice * item.quantity,
    variation_id: item.variationId || null,
  }));

  const { data: items } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  return {
    ...mapOrderFromDb(order),
    items: (items || []).map(mapOrderItemFromDb),
  };
}

export async function updateOrderStatus(id: string, status: string): Promise<Order | null> {
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return null;

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return mapOrderFromDb(data);
}

// ============================================================================
// QUOTES
// ============================================================================

export async function getQuotes(filters: QuoteFilters = {}): Promise<PaginatedResponse<QuoteWithDetails>> {
  const { buyerId, supplierId, status, page = 1, limit = 10 } = filters;

  let query = supabase
    .from('quotes')
    .select(`
      *,
      profiles!quotes_buyer_id_fkey(id, display_name),
      categories(id, name, name_en),
      quote_replies(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (buyerId) query = query.eq('buyer_id', buyerId);
  if (status) query = query.eq('status', status);

  return paginatedQuery<QuoteWithDetails>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map((row: Record<string, unknown>) => mapQuoteWithDetailsFromDb(row)),
  }));
}

export async function getQuoteById(id: string): Promise<QuoteWithDetails | null> {
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      profiles!quotes_buyer_id_fkey(id, display_name),
      categories(id, name, name_en)
    `)
    .eq('id', id)
    .single();
  if (error || !quote) return null;

  const { data: replies } = await supabase
    .from('quote_replies')
    .select(`
      *,
      suppliers(id, name, name_en, logo_url)
    `)
    .eq('quote_id', id);

  return {
    ...mapQuoteFromDb(quote),
    buyer: quote.profiles ? { id: quote.profiles.id, displayName: quote.profiles.display_name } : undefined,
    category: quote.categories ? { id: quote.categories.id, name: quote.categories.name, nameEn: quote.categories.name_en } : null,
    replies: (replies || []).map(mapQuoteReplyFromDb),
    replyCount: (replies || []).length,
  };
}

export async function createQuote(data: {
  buyerId: string;
  title: string;
  description?: string;
  categoryId?: string;
  quantity?: number;
  unit?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deadline?: string;
}): Promise<Quote | null> {
  const { data: result, error } = await supabase
    .from('quotes')
    .insert({
      buyer_id: data.buyerId,
      title: data.title,
      description: data.description || null,
      category_id: data.categoryId || null,
      quantity: data.quantity || null,
      unit: data.unit || null,
      budget_min: data.budgetMin || null,
      budget_max: data.budgetMax || null,
      currency: data.currency || 'DZD',
      deadline: data.deadline || null,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapQuoteFromDb(result);
}

export async function createQuoteReply(quoteId: string, data: {
  supplierId: string;
  pricePerUnit?: number;
  currency?: string;
  message?: string;
  deliveryTime?: string;
}): Promise<QuoteReply | null> {
  const { data: result, error } = await supabase
    .from('quote_replies')
    .insert({
      quote_id: quoteId,
      supplier_id: data.supplierId,
      price_per_unit: data.pricePerUnit || null,
      currency: data.currency || 'DZD',
      message: data.message || null,
      delivery_time: data.deliveryTime || null,
    })
    .select(`
      *,
      suppliers(id, name, name_en, logo_url)
    `)
    .single();
  if (error || !result) return null;
  return mapQuoteReplyFromDb(result);
}

export async function updateQuoteStatus(id: string, status: string): Promise<Quote | null> {
  const validStatuses = ['open', 'replied', 'closed', 'expired'];
  if (!validStatuses.includes(status)) return null;

  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return mapQuoteFromDb(data);
}

// ============================================================================
// REVIEWS
// ============================================================================

export async function getReviews(filters: ReviewFilters = {}): Promise<PaginatedResponse<Review>> {
  const { productId, supplierId, page = 1, limit = 10 } = filters;

  let query = supabase
    .from('reviews')
    .select(`
      *,
      profiles!reviews_buyer_id_fkey(id, display_name, avatar_url)
    `, { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (productId) query = query.eq('product_id', productId);
  if (supplierId) query = query.eq('supplier_id', supplierId);

  return paginatedQuery<Review>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapReviewFromDb),
  }));
}

export async function createReview(data: {
  buyerId: string;
  productId?: string;
  supplierId?: string;
  rating: number;
  title?: string;
  comment?: string;
}): Promise<Review | null> {
  if (!data.productId && !data.supplierId) return null;

  const { data: result, error } = await supabase
    .from('reviews')
    .insert({
      buyer_id: data.buyerId,
      product_id: data.productId || null,
      supplier_id: data.supplierId || null,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment || null,
    })
    .select(`
      *,
      profiles!reviews_buyer_id_fkey(id, display_name, avatar_url)
    `)
    .single();
  if (error || !result) return null;
  return mapReviewFromDb(result);
}

export async function getAverageRating(supplierId: string): Promise<AverageRating> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('supplier_id', supplierId)
    .eq('is_published', true);

  if (error || !data || data.length === 0) {
    return { avg: 0, count: 0 };
  }

  const total = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
  return {
    avg: Math.round((total / data.length) * 10) / 10,
    count: data.length,
  };
}

// ============================================================================
// FAVORITES
// ============================================================================

export async function getFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      products:product_id(id, name, name_en, price, currency),
      suppliers:supplier_id(id, name, name_en, logo_url, city, rating, review_count),
      product_images!favorites_product_id_fkey(url, is_primary)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapFavoriteFromDb);
}

export async function addFavorite(
  userId: string,
  productId?: string,
  supplierId?: string,
): Promise<Favorite | null> {
  if (!productId && !supplierId) return null;

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      product_id: productId || null,
      supplier_id: supplierId || null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapFavoriteFromDb(data);
}

export async function removeFavorite(
  userId: string,
  productId?: string,
  supplierId?: string,
): Promise<boolean> {
  let query = supabase.from('favorites').delete().eq('user_id', userId);
  if (productId) query = query.eq('product_id', productId);
  if (supplierId) query = query.eq('supplier_id', supplierId);
  const { error } = await query;
  return !error;
}

export async function isFavorite(
  userId: string,
  productId?: string,
  supplierId?: string,
): Promise<boolean> {
  let query = supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId);
  if (productId) query = query.eq('product_id', productId);
  if (supplierId) query = query.eq('supplier_id', supplierId);
  const { data, error } = await query.maybeSingle();
  if (error) return false;
  return !!data;
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function getMessagesByUserId(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapMessageFromDb);
}

export async function getAllMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapMessageFromDb);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  // Get all messages involving the user
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_user_id_fkey(id, display_name, avatar_url),
      to_profile:profiles!messages_to_user_id_fkey(id, display_name, avatar_url)
    `)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Group by conversation_id, get the latest message and unread count
  const convMap = new Map<string, Conversation>();

  for (const msg of data) {
    const convId = msg.conversation_id;
    const isFromMe = msg.from_user_id === userId;
    const otherUser = isFromMe ? msg.to_profile : msg.from_profile;

    if (!convMap.has(convId)) {
      convMap.set(convId, {
        id: convId,
        conversationId: convId,
        otherUserId: otherUser?.id || '',
        otherUserName: otherUser?.display_name || 'Unknown',
        otherUserAvatar: otherUser?.avatar_url || null,
        lastMessage: msg.body,
        lastMessageAt: msg.created_at,
        unreadCount: 0,
        subject: msg.subject,
        messageType: msg.message_type,
      });
    }

    // Count unread
    if (!isFromMe && !msg.is_read) {
      const conv = convMap.get(convId)!;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function getMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_user_id_fkey(id, display_name, avatar_url),
      to_profile:profiles!messages_to_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map(mapConversationMessageFromDb);
}

export async function sendMessage(message: {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  subject?: string;
  body: string;
  conversationId?: string;
  messageType?: string;
  relatedId?: string;
}): Promise<ConversationMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversationId || undefined,
      from_user_id: message.fromUserId,
      to_user_id: message.toUserId,
      subject: message.subject || null,
      body: message.body,
      message_type: (message.messageType as 'product_inquiry' | 'badge_request' | 'ad_request' | 'general') || 'general',
      related_id: message.relatedId || null,
    })
    .select(`
      *,
      from_profile:profiles!messages_from_user_id_fkey(id, display_name, avatar_url),
      to_profile:profiles!messages_to_user_id_fkey(id, display_name, avatar_url)
    `)
    .single();
  if (error || !data) return null;
  return mapConversationMessageFromDb(data);
}

export async function markAsRead(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId);
  return !error;
}

export async function markMessageAsRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', id);
  return !error;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
  return !error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count || 0;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data || []).map(mapNotificationFromDb);
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  return !error;
}

export async function createNotification(data: {
  userId: string;
  title: string;
  body?: string;
  type?: string;
  actionUrl?: string;
}): Promise<Notification | null> {
  const { data: result, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId,
      title: data.title,
      body: data.body || null,
      type: (data.type as 'order' | 'quote' | 'message' | 'badge' | 'ad' | 'review' | 'system') || 'system',
      action_url: data.actionUrl || null,
    })
    .select()
    .single();
  if (error || !result) return null;
  return mapNotificationFromDb(result);
}

// ============================================================================
// BADGES
// ============================================================================

export async function getBadgeTypes(): Promise<BadgeType[]> {
  const { data, error } = await supabase
    .from('badge_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) return [];
  return (data || []).map(mapBadgeTypeFromDb);
}

export async function getBadgeRequests(filters: BadgeRequestFilters = {}): Promise<PaginatedResponse<BadgeRequest>> {
  const { supplierId, status, page = 1, limit = 10 } = filters;

  let query = supabase
    .from('badge_requests')
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      badge_types(id, name, name_en, slug, icon, color)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (status) query = query.eq('status', status);

  return paginatedQuery<BadgeRequest>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapBadgeRequestFromDb),
  }));
}

export async function createBadgeRequest(
  supplierId: string,
  badgeTypeId: string,
  message?: string,
): Promise<BadgeRequest | null> {
  const { data, error } = await supabase
    .from('badge_requests')
    .insert({
      supplier_id: supplierId,
      badge_type_id: badgeTypeId,
      message: message || null,
    })
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      badge_types(id, name, name_en, slug, icon, color)
    `)
    .single();
  if (error || !data) return null;
  return mapBadgeRequestFromDb(data);
}

export async function approveBadgeRequest(requestId: string, expiresAt?: string): Promise<BadgeRequest | null> {
  const { data: request, error: fetchError } = await supabase
    .from('badge_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (fetchError || !request) return null;

  // Update the request status
  const { error: updateError } = await supabase
    .from('badge_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (updateError) return null;

  // Create or reactivate supplier_badges entry
  const { error: badgeError } = await supabase
    .from('supplier_badges')
    .upsert({
      supplier_id: request.supplier_id,
      badge_type_id: request.badge_type_id,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt || null,
      is_active: true,
    }, { onConflict: 'supplier_id,badge_type_id' });
  if (badgeError) return null;

  return { ...mapBadgeRequestFromDb(request), status: 'approved' };
}

export async function rejectBadgeRequest(requestId: string, reason?: string): Promise<BadgeRequest | null> {
  const { data, error } = await supabase
    .from('badge_requests')
    .update({
      status: 'rejected',
      admin_note: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      badge_types(id, name, name_en, slug, icon, color)
    `)
    .single();
  if (error || !data) return null;
  return mapBadgeRequestFromDb(data);
}

export async function getSupplierBadges(supplierId: string): Promise<SupplierBadge[]> {
  const { data, error } = await supabase
    .from('supplier_badges')
    .select(`
      *,
      badge_types(id, name, name_en, slug, icon, color, description, description_en)
    `)
    .eq('supplier_id', supplierId)
    .eq('is_active', true);
  if (error) return [];
  return (data || []).map(mapSupplierBadgeFromDb);
}

// ============================================================================
// ADS
// ============================================================================

export async function getAdTypes(): Promise<AdType[]> {
  const { data, error } = await supabase
    .from('ad_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) return [];
  return (data || []).map(mapAdTypeFromDb);
}

export async function getAdRequests(filters: AdRequestFilters = {}): Promise<PaginatedResponse<AdRequest>> {
  const { supplierId, status, page = 1, limit = 10 } = filters;

  let query = supabase
    .from('ad_requests')
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      ad_types(id, name, name_en, slug, placement_type, description, price)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (status) query = query.eq('status', status);

  return paginatedQuery<AdRequest>(query, page, limit).then(res => ({
    ...res,
    data: res.data.map(mapAdRequestFromDb),
  }));
}

export async function createAdRequest(data: {
  supplierId: string;
  adTypeId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  message?: string;
}): Promise<AdRequest | null> {
  const { data: result, error } = await supabase
    .from('ad_requests')
    .insert({
      supplier_id: data.supplierId,
      ad_type_id: data.adTypeId,
      title: data.title,
      description: data.description || null,
      image_url: data.imageUrl || null,
      target_url: data.targetUrl || null,
      message: data.message || null,
    })
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      ad_types(id, name, name_en, slug, placement_type, description, price)
    `)
    .single();
  if (error || !result) return null;
  return mapAdRequestFromDb(result);
}

export async function approveAdRequest(
  requestId: string,
  startDate: string,
  endDate: string,
): Promise<AdRequest | null> {
  const { data, error } = await supabase
    .from('ad_requests')
    .update({
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      ad_types(id, name, name_en, slug, placement_type, description, price)
    `)
    .single();
  if (error || !data) return null;
  return mapAdRequestFromDb(data);
}

export async function rejectAdRequest(requestId: string, reason?: string): Promise<AdRequest | null> {
  const { data, error } = await supabase
    .from('ad_requests')
    .update({
      status: 'rejected',
      admin_note: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      ad_types(id, name, name_en, slug, placement_type, description, price)
    `)
    .single();
  if (error || !data) return null;
  return mapAdRequestFromDb(data);
}

export async function getActiveAds(): Promise<AdRequest[]> {
  const { data, error } = await supabase
    .from('ad_requests')
    .select(`
      *,
      suppliers(id, name, name_en, logo_url),
      ad_types(id, name, name_en, slug, placement_type, description, price)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapAdRequestFromDb);
}

// Legacy SupplierAds compatibility
export async function getAllAds(): Promise<SupplierAd[]> {
  const { data, error } = await supabase
    .from('supplier_ads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapAdFromDb);
}

export async function getAdsBySupplier(supplierId: string): Promise<SupplierAd[]> {
  const { data, error } = await supabase
    .from('supplier_ads')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapAdFromDb);
}

export async function createAd(ad: Omit<SupplierAd, 'id'>): Promise<SupplierAd | null> {
  const dbRow = {
    supplier_id: ad.supplierId,
    supplier_name: ad.supplierName,
    supplier_username: ad.supplierUsername,
    title: ad.title,
    description: ad.description,
    placement: ad.placement,
    status: ad.status,
    budget: ad.budget,
    impressions: ad.impressions,
    clicks: ad.clicks,
    start_date: ad.startDate,
    end_date: ad.endDate || null,
  };
  const { data, error } = await supabase
    .from('supplier_ads')
    .insert(dbRow)
    .select()
    .single();
  if (error || !data) return null;
  return mapAdFromDb(data);
}

export async function updateAd(id: string, updates: Partial<SupplierAd>): Promise<boolean> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.placement !== undefined) dbUpdates.placement = updates.placement;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
  if (updates.impressions !== undefined) dbUpdates.impressions = updates.impressions;
  if (updates.clicks !== undefined) dbUpdates.clicks = updates.clicks;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
  if (updates.adminNote !== undefined) dbUpdates.admin_note = updates.adminNote;

  const { error } = await supabase
    .from('supplier_ads')
    .update(dbUpdates)
    .eq('id', id);
  return !error;
}

export async function deleteAd(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('supplier_ads')
    .delete()
    .eq('id', id);
  return !error;
}

// ============================================================================
// STATS (Admin)
// ============================================================================

export async function getPlatformStats(): Promise<PlatformStats> {
  const [usersRes, suppliersRes, productsRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'delivered');

  const revenue = (revenueData || []).reduce((sum: number, o: { total_amount: number }) => sum + Number(o.total_amount), 0);

  return {
    users: usersRes.count || 0,
    suppliers: suppliersRes.count || 0,
    products: productsRes.count || 0,
    orders: ordersRes.count || 0,
    revenue: Math.round(revenue * 100) / 100,
  };
}

export async function getMonthlyRegistrations(): Promise<MonthlyData[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const monthMap = new Map<string, number>();
  for (const row of data) {
    const month = (row.created_at as string).substring(0, 7); // YYYY-MM
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  }

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}

export async function getMonthlyOrders(): Promise<MonthlyData[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const monthMap = new Map<string, number>();
  for (const row of data) {
    const month = (row.created_at as string).substring(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  }

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}

export async function getTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, name_en, total_sales, suppliers!inner(name)')
    .eq('status', 'active')
    .order('total_sales', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || null,
    totalSales: (row.total_sales as number) || 0,
    supplierName: (row.suppliers as Record<string, unknown>)?.name as string || '',
  }));
}

export async function getTopSuppliersBySales(limit: number = 10): Promise<TopSupplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, name_en, total_sales, rating, product_count')
    .eq('status', 'active')
    .order('total_sales', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || null,
    totalSales: (row.total_sales as number) || 0,
    rating: (row.rating as number) || 0,
    productCount: (row.product_count as number) || 0,
  }));
}

// ============================================================================
// DB MAPPERS — Legacy (backward compat)
// ============================================================================

function mapProfileFromDb(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    email: row.email as string,
    role: (row.role as 'admin' | 'supplier' | 'buyer' | 'user') || 'buyer',
    supplierStatus: (row.supplier_status as 'pending' | 'approved' | 'rejected') ?? undefined,
    createdAt: row.created_at as string,
    supplierProfile: row.company_name ? {
      name: (row.company_name as string) || '',
      nameEn: (row.company_name_en as string) || '',
      description: (row.description as string) || '',
      descriptionEn: (row.description_en as string) || '',
      category: (row.category as string) || '',
      logoUrl: (row.logo_url as string) || '',
      coverUrl: (row.cover_url as string) || '',
      address: (row.address as string) || '',
      addressEn: (row.address_en as string) || '',
      contact: {
        phone: (row.phone as string) || '',
        whatsapp: (row.whatsapp as string) || '',
        email: (row.email as string) || '',
      },
      badge: (row.badge as 'gold' | 'blue' | 'none') || 'none',
    } : undefined,
  };
}

function mapProfileTypedFromDb(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    email: row.email as string,
    phone: (row.phone as string) || null,
    avatarUrl: (row.avatar_url as string) || null,
    role: (row.role as 'admin' | 'supplier' | 'buyer') || 'buyer',
    locale: (row.locale as 'ar' | 'fr') || 'ar',
    currency: (row.currency as 'DZD' | 'EUR' | 'USD') || 'DZD',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSupplierFromDb(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || '',
    description: (row.description as string) || '',
    descriptionEn: (row.description_en as string) || '',
    category: (row.category as string) || '',
    logoUrl: (row.logo_url as string) || '',
    coverUrl: (row.cover_url as string) || '',
    address: (row.address as string) || '',
    addressEn: (row.address_en as string) || '',
    contact: {
      phone: (row.phone as string) || '',
      whatsapp: (row.whatsapp as string) || '',
      email: (row.email as string) || '',
    },
    rating: (row.rating as number) || 0,
    reviewCount: (row.review_count as number) || 0,
    views: (row.views as number) || 0,
    productCount: (row.product_count as number) || 0,
    badge: (row.badge as 'gold' | 'blue' | 'none') || 'none',
    status: (row.status as 'pending' | 'approved' | 'rejected' | 'active' | 'suspended') || 'active',
    joinedDate: (row.created_at as string) || '',
    isVerified: (row.is_verified as boolean) || false,
  };
}

function mapProductFromDb(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    supplierName: row.supplier_name as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || '',
    price: (row.price as number) || 0,
    currency: (row.currency as string) || 'DZD',
    description: (row.description as string) || '',
    descriptionEn: (row.description_en as string) || '',
    imageUrl: (row.image_url as string) || '',
    category: (row.category as string) || '',
    inStock: (row.in_stock as boolean) ?? true,
    unit: (row.unit as string) || '',
    minOrder: (row.min_order as number) || 1,
    createdAt: row.created_at as string,
  };
}

function mapMessageFromDb(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    fromUsername: row.from_user_id as string,
    fromDisplayName: row.from_display_name as string,
    toUsername: row.to_user_id as string,
    subject: row.subject as string,
    body: row.body as string,
    isRead: (row.is_read as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

function mapAdFromDb(row: Record<string, unknown>): SupplierAd {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    supplierName: row.supplier_name as string,
    supplierUsername: (row.supplier_username as string) || '',
    title: row.title as string,
    description: (row.description as string) || '',
    placement: (row.placement as 'top' | 'featured' | 'highlighted') || 'featured',
    status: (row.status as 'pending' | 'active' | 'rejected' | 'expired' | 'paused') || 'pending',
    budget: (row.budget as number) || 0,
    impressions: (row.impressions as number) || 0,
    clicks: (row.clicks as number) || 0,
    startDate: row.start_date as string,
    endDate: (row.end_date as string) || undefined,
    adminNote: (row.admin_note as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// DB MAPPERS — New schema-mapped types
// ============================================================================

function mapProductRowFromDb(row: Record<string, unknown>): ProductRow {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    name: row.name as string,
    nameEn: (row.name_en as string) || null,
    slug: row.slug as string,
    description: (row.description as string) || null,
    descriptionEn: (row.description_en as string) || null,
    price: Number(row.price) || 0,
    currency: (row.currency as 'DZD' | 'EUR' | 'USD') || 'DZD',
    categoryId: (row.category_id as string) || null,
    subcategoryId: (row.subcategory_id as string) || null,
    minOrder: (row.min_order as number) || 1,
    unit: (row.unit as string) || 'piece',
    inStock: (row.in_stock as boolean) ?? true,
    stockQuantity: row.stock_quantity as number | null,
    isFeatured: (row.is_featured as boolean) || false,
    views: (row.views as number) || 0,
    totalSales: (row.total_sales as number) || 0,
    status: (row.status as 'active' | 'draft' | 'archived') || 'active',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapProductImageFromDb(row: Record<string, unknown>): ProductImage {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    url: row.url as string,
    altText: (row.alt_text as string) || null,
    sortOrder: (row.sort_order as number) || 0,
    isPrimary: (row.is_primary as boolean) || false,
    createdAt: row.created_at as string,
  };
}

function mapProductVariationFromDb(row: Record<string, unknown>): ProductVariation {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    variationType: row.variation_type as 'size' | 'color' | 'material' | 'weight',
    variationValue: row.variation_value as string,
    sku: (row.sku as string) || null,
    priceOverride: row.price_override !== null ? Number(row.price_override) : null,
    stockQuantity: row.stock_quantity as number | null,
    createdAt: row.created_at as string,
  };
}

function mapCategoryFromDb(row: Record<string, unknown>): Category {
  const subcats = row.subcategories;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: row.name_en as string,
    slug: row.slug as string,
    icon: (row.icon as string) || null,
    imageUrl: (row.image_url as string) || null,
    description: (row.description as string) || null,
    descriptionEn: (row.description_en as string) || null,
    sortOrder: (row.sort_order as number) || 0,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
    subcategoryCount: Array.isArray(subcats)
      ? (subcats as { count: number }[]).reduce((s: number, sc) => s + (sc.count || 0), 0)
      : Array.isArray(subcats) ? subcats.length : 0,
    subcategories: Array.isArray(subcats) && subcats.length > 0 && typeof subcats[0] === 'object' && 'id' in subcats[0]
      ? (subcats as Record<string, unknown>[]).map(mapSubcategoryFromDb)
      : undefined,
  };
}

function mapSubcategoryFromDb(row: Record<string, unknown>): Subcategory {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    nameEn: row.name_en as string,
    slug: row.slug as string,
    icon: (row.icon as string) || null,
    imageUrl: (row.image_url as string) || null,
    sortOrder: (row.sort_order as number) || 0,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
  };
}

function mapOrderFromDb(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    buyerId: row.buyer_id as string,
    supplierId: row.supplier_id as string,
    status: (row.status as 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled') || 'pending',
    totalAmount: Number(row.total_amount) || 0,
    currency: (row.currency as 'DZD' | 'EUR' | 'USD') || 'DZD',
    notes: (row.notes as string) || null,
    shippingAddress: (row.shipping_address as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapOrderWithDetailsFromDb(row: Record<string, unknown>): OrderWithDetails {
  return {
    ...mapOrderFromDb(row),
    buyer: row.profiles ? {
      id: (row.profiles as Record<string, unknown>).id as string,
      displayName: (row.profiles as Record<string, unknown>).display_name as string,
      email: (row.profiles as Record<string, unknown>).email as string,
    } : undefined,
    supplier: row.suppliers ? {
      id: (row.suppliers as Record<string, unknown>).id as string,
      name: (row.suppliers as Record<string, unknown>).name as string,
      nameEn: (row.suppliers as Record<string, unknown>).name_en as string,
      logoUrl: (row.suppliers as Record<string, unknown>).logo_url as string,
    } : undefined,
  };
}

function mapOrderItemFromDb(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    productId: (row.product_id as string) || null,
    productName: row.product_name as string,
    quantity: (row.quantity as number) || 1,
    unitPrice: Number(row.unit_price) || 0,
    totalPrice: Number(row.total_price) || 0,
    variationId: (row.variation_id as string) || null,
    createdAt: row.created_at as string,
  };
}

function mapQuoteFromDb(row: Record<string, unknown>): Quote {
  return {
    id: row.id as string,
    buyerId: row.buyer_id as string,
    title: row.title as string,
    description: (row.description as string) || null,
    categoryId: (row.category_id as string) || null,
    quantity: (row.quantity as number) || null,
    unit: (row.unit as string) || null,
    budgetMin: row.budget_min !== null ? Number(row.budget_min) : null,
    budgetMax: row.budget_max !== null ? Number(row.budget_max) : null,
    currency: (row.currency as 'DZD' | 'EUR' | 'USD') || 'DZD',
    deadline: (row.deadline as string) || null,
    status: (row.status as 'open' | 'replied' | 'closed' | 'expired') || 'open',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapQuoteWithDetailsFromDb(row: Record<string, unknown>): QuoteWithDetails {
  const replies = row.quote_replies;
  return {
    ...mapQuoteFromDb(row),
    buyer: row.profiles ? {
      id: (row.profiles as Record<string, unknown>).id as string,
      displayName: (row.profiles as Record<string, unknown>).display_name as string,
    } : undefined,
    category: row.categories ? {
      id: (row.categories as Record<string, unknown>).id as string,
      name: (row.categories as Record<string, unknown>).name as string,
      nameEn: (row.categories as Record<string, unknown>).name_en as string,
    } : null,
    replyCount: Array.isArray(replies) ? (replies as { count: number }[]).reduce((s: number, r) => s + (r.count || 0), 0) : 0,
  };
}

function mapQuoteReplyFromDb(row: Record<string, unknown>): QuoteReply {
  return {
    id: row.id as string,
    quoteId: row.quote_id as string,
    supplierId: row.supplier_id as string,
    pricePerUnit: row.price_per_unit !== null ? Number(row.price_per_unit) : null,
    currency: (row.currency as 'DZD' | 'EUR' | 'USD') || 'DZD',
    message: (row.message as string) || null,
    deliveryTime: (row.delivery_time as string) || null,
    status: (row.status as 'pending' | 'accepted' | 'rejected') || 'pending',
    createdAt: row.created_at as string,
    supplier: row.suppliers ? {
      id: (row.suppliers as Record<string, unknown>).id as string,
      name: (row.suppliers as Record<string, unknown>).name as string,
      nameEn: (row.suppliers as Record<string, unknown>).name_en as string,
      logoUrl: (row.suppliers as Record<string, unknown>).logo_url as string,
    } : undefined,
  };
}

function mapReviewFromDb(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    productId: (row.product_id as string) || null,
    supplierId: (row.supplier_id as string) || null,
    buyerId: row.buyer_id as string,
    rating: (row.rating as number) || 5,
    title: (row.title as string) || null,
    comment: (row.comment as string) || null,
    isPublished: (row.is_published as boolean) ?? true,
    createdAt: row.created_at as string,
    buyer: row.profiles ? {
      id: (row.profiles as Record<string, unknown>).id as string,
      displayName: (row.profiles as Record<string, unknown>).display_name as string,
      avatarUrl: (row.profiles as Record<string, unknown>).avatar_url as string,
    } : undefined,
  };
}

function mapFavoriteFromDb(row: Record<string, unknown>): Favorite {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    productId: (row.product_id as string) || null,
    supplierId: (row.supplier_id as string) || null,
    createdAt: row.created_at as string,
    product: row.products ? {
      id: (row.products as Record<string, unknown>).id as string,
      name: (row.products as Record<string, unknown>).name as string,
      nameEn: (row.products as Record<string, unknown>).name_en as string,
      price: Number((row.products as Record<string, unknown>).price) || 0,
      currency: (row.products as Record<string, unknown>).currency as 'DZD' | 'EUR' | 'USD',
      primaryImage: null,
    } : undefined,
    supplier: row.suppliers ? {
      id: (row.suppliers as Record<string, unknown>).id as string,
      name: (row.suppliers as Record<string, unknown>).name as string,
      nameEn: (row.suppliers as Record<string, unknown>).name_en as string,
      logoUrl: (row.suppliers as Record<string, unknown>).logo_url as string,
      city: (row.suppliers as Record<string, unknown>).city as string,
      rating: Number((row.suppliers as Record<string, unknown>).rating) || 0,
      reviewCount: (row.suppliers as Record<string, unknown>).review_count as number,
    } : undefined,
  };
}

function mapConversationMessageFromDb(row: Record<string, unknown>): ConversationMessage {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    fromUserId: row.from_user_id as string,
    toUserId: row.to_user_id as string,
    subject: (row.subject as string) || null,
    body: row.body as string,
    isRead: (row.is_read as boolean) ?? false,
    messageType: (row.message_type as 'product_inquiry' | 'badge_request' | 'ad_request' | 'general') || 'general',
    relatedId: (row.related_id as string) || null,
    createdAt: row.created_at as string,
    fromUser: row.from_profile ? {
      id: (row.from_profile as Record<string, unknown>).id as string,
      displayName: (row.from_profile as Record<string, unknown>).display_name as string,
      avatarUrl: (row.from_profile as Record<string, unknown>).avatar_url as string,
    } : undefined,
    toUser: row.to_profile ? {
      id: (row.to_profile as Record<string, unknown>).id as string,
      displayName: (row.to_profile as Record<string, unknown>).display_name as string,
      avatarUrl: (row.to_profile as Record<string, unknown>).avatar_url as string,
    } : undefined,
  };
}

function mapNotificationFromDb(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    body: (row.body as string) || null,
    type: (row.type as 'order' | 'quote' | 'message' | 'badge' | 'ad' | 'review' | 'system') || 'system',
    isRead: (row.is_read as boolean) ?? false,
    actionUrl: (row.action_url as string) || null,
    createdAt: row.created_at as string,
  };
}

function mapBadgeTypeFromDb(row: Record<string, unknown>): BadgeType {
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: row.name_en as string,
    slug: row.slug as string,
    icon: row.icon as string,
    color: row.color as string,
    description: (row.description as string) || null,
    descriptionEn: (row.description_en as string) || null,
    price: Number(row.price) || 0,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
  };
}

function mapBadgeRequestFromDb(row: Record<string, unknown>): BadgeRequest {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    badgeTypeId: row.badge_type_id as string,
    status: (row.status as 'pending' | 'approved' | 'rejected') || 'pending',
    message: (row.message as string) || null,
    adminNote: (row.admin_note as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    supplier: row.suppliers ? {
      id: (row.suppliers as Record<string, unknown>).id as string,
      name: (row.suppliers as Record<string, unknown>).name as string,
      nameEn: (row.suppliers as Record<string, unknown>).name_en as string,
      logoUrl: (row.suppliers as Record<string, unknown>).logo_url as string,
    } : undefined,
    badgeType: row.badge_types ? {
      id: (row.badge_types as Record<string, unknown>).id as string,
      name: (row.badge_types as Record<string, unknown>).name as string,
      nameEn: (row.badge_types as Record<string, unknown>).name_en as string,
      slug: (row.badge_types as Record<string, unknown>).slug as string,
      icon: (row.badge_types as Record<string, unknown>).icon as string,
      color: (row.badge_types as Record<string, unknown>).color as string,
      description: (row.badge_types as Record<string, unknown>).description as string,
      descriptionEn: (row.badge_types as Record<string, unknown>).description_en as string,
      price: Number((row.badge_types as Record<string, unknown>).price) || 0,
      isActive: true,
      createdAt: (row.badge_types as Record<string, unknown>).created_at as string,
    } : undefined,
  };
}

function mapSupplierBadgeFromDb(row: Record<string, unknown>): SupplierBadge {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    badgeTypeId: row.badge_type_id as string,
    activatedAt: row.activated_at as string,
    expiresAt: (row.expires_at as string) || null,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
    badgeType: row.badge_types ? {
      id: (row.badge_types as Record<string, unknown>).id as string,
      name: (row.badge_types as Record<string, unknown>).name as string,
      nameEn: (row.badge_types as Record<string, unknown>).name_en as string,
      slug: (row.badge_types as Record<string, unknown>).slug as string,
      icon: (row.badge_types as Record<string, unknown>).icon as string,
      color: (row.badge_types as Record<string, unknown>).color as string,
      description: (row.badge_types as Record<string, unknown>).description as string,
      descriptionEn: (row.badge_types as Record<string, unknown>).description_en as string,
      price: Number((row.badge_types as Record<string, unknown>).price) || 0,
      isActive: true,
      createdAt: (row.badge_types as Record<string, unknown>).created_at as string,
    } : undefined,
  };
}

function mapAdTypeFromDb(row: Record<string, unknown>): AdType {
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: row.name_en as string,
    slug: row.slug as string,
    placementType: (row.placement_type as 'banner' | 'featured' | 'product_boost' | 'category' | 'sidebar') || 'banner',
    description: (row.description as string) || null,
    price: Number(row.price) || 0,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
  };
}

function mapAdRequestFromDb(row: Record<string, unknown>): AdRequest {
  return {
    id: row.id as string,
    supplierId: row.supplier_id as string,
    adTypeId: row.ad_type_id as string,
    title: row.title as string,
    description: (row.description as string) || null,
    imageUrl: (row.image_url as string) || null,
    targetUrl: (row.target_url as string) || null,
    status: (row.status as 'pending' | 'active' | 'rejected' | 'expired') || 'pending',
    message: (row.message as string) || null,
    adminNote: (row.admin_note as string) || null,
    startDate: (row.start_date as string) || null,
    endDate: (row.end_date as string) || null,
    impressions: (row.impressions as number) || 0,
    clicks: (row.clicks as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    supplier: row.suppliers ? {
      id: (row.suppliers as Record<string, unknown>).id as string,
      name: (row.suppliers as Record<string, unknown>).name as string,
      nameEn: (row.suppliers as Record<string, unknown>).name_en as string,
      logoUrl: (row.suppliers as Record<string, unknown>).logo_url as string,
    } : undefined,
    adType: row.ad_types ? {
      id: (row.ad_types as Record<string, unknown>).id as string,
      name: (row.ad_types as Record<string, unknown>).name as string,
      nameEn: (row.ad_types as Record<string, unknown>).name_en as string,
      slug: (row.ad_types as Record<string, unknown>).slug as string,
      placementType: (row.ad_types as Record<string, unknown>).placement_type as 'banner' | 'featured' | 'product_boost' | 'category' | 'sidebar',
      description: (row.ad_types as Record<string, unknown>).description as string,
      price: Number((row.ad_types as Record<string, unknown>).price) || 0,
      isActive: true,
      createdAt: (row.ad_types as Record<string, unknown>).created_at as string,
    } : undefined,
  };
}
