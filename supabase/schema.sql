-- ============================================================================
-- BUSINFO B2B Marketplace Platform - Complete Supabase Database Schema
-- ============================================================================
-- Supabase URL: https://bddpxpglnpndgdygdtth.supabase.co
-- Database: PostgreSQL (Supabase managed)
-- 
-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- https://bddpxpglnpndgdygdtth.supabase.co → SQL Editor → New Query
--
-- Open Registration Model:
--   - Users can register freely (supplier/buyer roles)
--   - Suppliers and products are visible immediately (no approval needed)
--   - Only BADGE REQUESTS and AD REQUESTS require admin approval
-- ============================================================================
-- DROP ALL EXISTING OBJECTS (uncomment to clean reset)
-- ============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS on_product_change ON public.products;
-- DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
-- DROP TRIGGER IF EXISTS on_order_change ON public.orders;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.profiles;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.suppliers;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.products;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.orders;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.quotes;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.badge_requests;
-- DROP TRIGGER IF EXISTS update_updated_at_column ON public.ad_requests;
-- 
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.update_product_count();
-- DROP FUNCTION IF EXISTS public.update_supplier_rating();
-- DROP FUNCTION IF EXISTS public.update_order_totals();
-- DROP FUNCTION IF EXISTS public.update_updated_at_column();
-- 
-- DROP TABLE IF EXISTS public.ad_requests CASCADE;
-- DROP TABLE IF EXISTS public.ad_types CASCADE;
-- DROP TABLE IF EXISTS public.supplier_badges CASCADE;
-- DROP TABLE IF EXISTS public.badge_requests CASCADE;
-- DROP TABLE IF EXISTS public.badge_types CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.favorites CASCADE;
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.quote_replies CASCADE;
-- DROP TABLE IF EXISTS public.quotes CASCADE;
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.product_variations CASCADE;
-- DROP TABLE IF EXISTS public.product_images CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.subcategories CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.suppliers CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- ============================================================================


-- ============================================================================
-- 1. PROFILES TABLE - extends auth.users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin', 'supplier', 'buyer')),
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'fr')),
  currency TEXT NOT NULL DEFAULT 'DZD' CHECK (currency IN ('DZD', 'EUR', 'USD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT profiles_username_length CHECK (LENGTH(username) >= 3),
  CONSTRAINT profiles_display_name_not_empty CHECK (LENGTH(display_name) >= 1)
);

COMMENT ON TABLE public.profiles IS 'Extends auth.users with platform-specific fields. Auto-created on signup.';


-- ============================================================================
-- 2. SUPPLIERS TABLE - supplier storefronts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  address_en TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'DZ',
  rating NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5.0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  product_count INTEGER NOT NULL DEFAULT 0 CHECK (product_count >= 0),
  total_sales INTEGER NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.suppliers IS 'Supplier storefront profiles. Created when a user with role=supplier registers. Visible immediately (open registration).';


-- ============================================================================
-- 3. CATEGORIES TABLE - main product categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  description TEXT,
  description_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Main product/service categories for the marketplace.';

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);


-- ============================================================================
-- 4. SUBCATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique slug per category
  CONSTRAINT subcategories_slug_category_unique UNIQUE (category_id, slug)
);

COMMENT ON TABLE public.subcategories IS 'Subcategories within each main category.';

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_active ON public.subcategories(is_active);


-- ============================================================================
-- 5. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'DZD' CHECK (currency IN ('DZD', 'EUR', 'USD')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  min_order INTEGER NOT NULL DEFAULT 1 CHECK (min_order >= 1),
  unit TEXT NOT NULL DEFAULT 'piece',
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT NULL CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  total_sales INTEGER NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique slug per supplier
  CONSTRAINT products_slug_supplier_unique UNIQUE (supplier_id, slug)
);

COMMENT ON TABLE public.products IS 'Products listed by suppliers. Visible immediately when active (open registration).';

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);


-- ============================================================================
-- 6. PRODUCT_IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.product_images IS 'Multiple images per product. First primary image is the main thumbnail.';

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_id, sort_order);


-- ============================================================================
-- 7. PRODUCT_VARIATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL CHECK (variation_type IN ('size', 'color', 'material', 'weight')),
  variation_value TEXT NOT NULL,
  sku TEXT,
  price_override NUMERIC(12,2) CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique variation per product
  CONSTRAINT product_variations_unique UNIQUE (product_id, variation_type, variation_value)
);

COMMENT ON TABLE public.product_images IS 'Product variations (size, color, material, weight). price_override overrides base price if set.';

CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON public.product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_sku ON public.product_variations(sku);
CREATE INDEX IF NOT EXISTS idx_product_variations_type ON public.product_variations(variation_type);


-- ============================================================================
-- 8. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'DZD' CHECK (currency IN ('DZD', 'EUR', 'USD')),
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Purchase orders from buyers to suppliers.';

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON public.orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);


-- ============================================================================
-- 9. ORDER_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'Individual line items within an order.';

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variation_id ON public.order_items(variation_id);


-- ============================================================================
-- 10. QUOTES TABLE - Request for Quote (RFQ)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  quantity INTEGER,
  unit TEXT,
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'DZD' CHECK (currency IN ('DZD', 'EUR', 'USD')),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Budget validation
  CONSTRAINT quotes_budget_check CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

COMMENT ON TABLE public.quotes IS 'Request for Quote (RFQ) submissions from buyers.';

CREATE INDEX IF NOT EXISTS idx_quotes_buyer_id ON public.quotes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_category_id ON public.quotes(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_deadline ON public.quotes(deadline);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at);


-- ============================================================================
-- 11. QUOTE_REPLIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quote_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  price_per_unit NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'DZD' CHECK (currency IN ('DZD', 'EUR', 'USD')),
  message TEXT,
  delivery_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One reply per supplier per quote
  CONSTRAINT quote_replies_unique UNIQUE (quote_id, supplier_id)
);

COMMENT ON TABLE public.quote_replies IS 'Supplier responses to quote requests.';

CREATE INDEX IF NOT EXISTS idx_quote_replies_quote_id ON public.quote_replies(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_replies_supplier_id ON public.quote_replies(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quote_replies_status ON public.quote_replies(status);


-- ============================================================================
-- 12. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Must review either a product or a supplier (or both)
  CONSTRAINT reviews_target CHECK (product_id IS NOT NULL OR supplier_id IS NOT NULL),
  -- One review per buyer per product
  CONSTRAINT reviews_buyer_product_unique UNIQUE (buyer_id, product_id)
);

COMMENT ON TABLE public.reviews IS 'Product and/or supplier reviews by buyers.';

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier_id ON public.reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON public.reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);


-- ============================================================================
-- 13. FAVORITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Must favorite either a product or a supplier
  CONSTRAINT favorites_target CHECK (product_id IS NOT NULL OR supplier_id IS NOT NULL),
  -- Unique constraints
  CONSTRAINT favorites_user_product_unique UNIQUE (user_id, product_id),
  CONSTRAINT favorites_user_supplier_unique UNIQUE (user_id, supplier_id)
);

COMMENT ON TABLE public.favorites IS 'Buyer favorites (products and suppliers).';

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_supplier_id ON public.favorites(supplier_id);


-- ============================================================================
-- 14. MESSAGES TABLE - messaging system
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  message_type TEXT NOT NULL DEFAULT 'general' CHECK (message_type IN ('product_inquiry', 'badge_request', 'ad_request', 'general')),
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS 'Direct messages between users. conversation_id groups related messages into a thread.';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);


-- ============================================================================
-- 15. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('order', 'quote', 'message', 'badge', 'ad', 'review', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'User notification feed.';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);


-- ============================================================================
-- 16. BADGE_TYPES TABLE - badge definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badge_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.badge_types IS 'Definitions of available badges suppliers can request.';

CREATE INDEX IF NOT EXISTS idx_badge_types_slug ON public.badge_types(slug);
CREATE INDEX IF NOT EXISTS idx_badge_types_is_active ON public.badge_types(is_active);


-- ============================================================================
-- 17. BADGE_REQUESTS TABLE - supplier badge requests (require admin approval)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badge_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  badge_type_id UUID NOT NULL REFERENCES public.badge_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate active/pending requests
  CONSTRAINT badge_requests_unique UNIQUE (supplier_id, badge_type_id, status)
);

COMMENT ON TABLE public.badge_requests IS 'Badge requests from suppliers. REQUIRES ADMIN APPROVAL.';

CREATE INDEX IF NOT EXISTS idx_badge_requests_supplier_id ON public.badge_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_badge_requests_badge_type_id ON public.badge_requests(badge_type_id);
CREATE INDEX IF NOT EXISTS idx_badge_requests_status ON public.badge_requests(status);


-- ============================================================================
-- 18. SUPPLIER_BADGES TABLE - active badges on suppliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.supplier_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  badge_type_id UUID NOT NULL REFERENCES public.badge_types(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active badge per type per supplier
  CONSTRAINT supplier_badges_unique UNIQUE (supplier_id, badge_type_id)
);

COMMENT ON TABLE public.supplier_badges IS 'Currently active badges on suppliers. Created when a badge_request is approved.';

CREATE INDEX IF NOT EXISTS idx_supplier_badges_supplier_id ON public.supplier_badges(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_badges_badge_type_id ON public.supplier_badges(badge_type_id);
CREATE INDEX IF NOT EXISTS idx_supplier_badges_is_active ON public.supplier_badges(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_badges_expires_at ON public.supplier_badges(expires_at);


-- ============================================================================
-- 19. AD_TYPES TABLE - ad type definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ad_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  placement_type TEXT NOT NULL CHECK (placement_type IN ('banner', 'featured', 'product_boost', 'category', 'sidebar')),
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ad_types IS 'Definitions of available advertising placements.';

CREATE INDEX IF NOT EXISTS idx_ad_types_slug ON public.ad_types(slug);
CREATE INDEX IF NOT EXISTS idx_ad_types_placement_type ON public.ad_types(placement_type);
CREATE INDEX IF NOT EXISTS idx_ad_types_is_active ON public.ad_types(is_active);


-- ============================================================================
-- 20. AD_REQUESTS TABLE - ad purchase requests (require admin approval)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ad_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  ad_type_id UUID NOT NULL REFERENCES public.ad_types(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  target_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired')),
  message TEXT,
  admin_note TEXT,
  start_date DATE,
  end_date DATE,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Date validation
  CONSTRAINT ad_requests_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

COMMENT ON TABLE public.ad_requests IS 'Ad purchase requests from suppliers. REQUIRES ADMIN APPROVAL.';

CREATE INDEX IF NOT EXISTS idx_ad_requests_supplier_id ON public.ad_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_ad_type_id ON public.ad_requests(ad_type_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_status ON public.ad_requests(status);
CREATE INDEX IF NOT EXISTS idx_ad_requests_start_date ON public.ad_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_ad_requests_end_date ON public.ad_requests(end_date);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on ALL tables
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_requests ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PROFILES RLS
-- ============================================================================

-- Anyone can read profiles
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can manage all profiles
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- SUPPLIERS RLS
-- ============================================================================

-- Anyone can read active suppliers (open model)
CREATE POLICY "suppliers_public_read_active" ON public.suppliers
  FOR SELECT USING (status = 'active');

-- Supplier owners can read their own (even if suspended)
CREATE POLICY "suppliers_read_own" ON public.suppliers
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can create their own supplier storefront
CREATE POLICY "suppliers_insert_own" ON public.suppliers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Supplier owners can update their own
CREATE POLICY "suppliers_update_own" ON public.suppliers
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can manage all suppliers
CREATE POLICY "suppliers_admin_all" ON public.suppliers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- CATEGORIES RLS
-- ============================================================================

-- Public read for active categories
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

-- Admin can manage categories
CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- SUBCATEGORIES RLS
-- ============================================================================

-- Public read for active subcategories
CREATE POLICY "subcategories_public_read" ON public.subcategories
  FOR SELECT USING (true);

-- Admin can manage subcategories
CREATE POLICY "subcategories_admin_all" ON public.subcategories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- PRODUCTS RLS
-- ============================================================================

-- Anyone can read active products (open model)
CREATE POLICY "products_public_read_active" ON public.products
  FOR SELECT USING (status = 'active');

-- Product owners (supplier) can read their own products
CREATE POLICY "products_read_own" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier owners can create products
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Supplier owners can update their products
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Supplier owners can delete their products
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Admin can manage all products
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- PRODUCT_IMAGES RLS
-- ============================================================================

-- Anyone can read product images (they're on active products)
CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      JOIN public.products pr ON pr.supplier_id = s.id
      WHERE pr.id = product_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier owners can manage their product images
CREATE POLICY "product_images_supplier_crud" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      JOIN public.products pr ON pr.supplier_id = s.id
      WHERE pr.id = product_id AND p.id = auth.uid()
    )
  );

-- Admin can manage all product images
CREATE POLICY "product_images_admin_all" ON public.product_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- PRODUCT_VARIATIONS RLS
-- ============================================================================

-- Public read for variations of active products
CREATE POLICY "product_variations_public_read" ON public.product_variations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      JOIN public.products pr ON pr.supplier_id = s.id
      WHERE pr.id = product_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier owners can manage their product variations
CREATE POLICY "product_variations_supplier_crud" ON public.product_variations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      JOIN public.products pr ON pr.supplier_id = s.id
      WHERE pr.id = product_id AND p.id = auth.uid()
    )
  );

-- Admin can manage all product variations
CREATE POLICY "product_variations_admin_all" ON public.product_variations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- ORDERS RLS
-- ============================================================================

-- Buyer can read their own orders
CREATE POLICY "orders_buyer_read" ON public.orders
  FOR SELECT USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier can read orders addressed to them
CREATE POLICY "orders_supplier_read" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Authenticated users can create orders
CREATE POLICY "orders_authenticated_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND buyer_id = auth.uid());

-- Buyer can update their own orders (cancel)
CREATE POLICY "orders_buyer_update" ON public.orders
  FOR UPDATE USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Supplier can update orders addressed to them (confirm, ship)
CREATE POLICY "orders_supplier_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Admin can manage all orders
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- ORDER_ITEMS RLS
-- ============================================================================

-- Users can read order items for their orders
CREATE POLICY "order_items_read_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.suppliers s ON s.id = o.supplier_id
      JOIN public.profiles p ON p.id = s.user_id
      WHERE o.id = order_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Buyer/Supplier can insert order items (via order creation)
CREATE POLICY "order_items_insert_own" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
  );

-- Admin can manage all order items
CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- QUOTES RLS
-- ============================================================================

-- Anyone can read open quotes
CREATE POLICY "quotes_public_read" ON public.quotes
  FOR SELECT USING (true);

-- Authenticated users can create quotes
CREATE POLICY "quotes_authenticated_insert" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND buyer_id = auth.uid());

-- Buyer can update their own quotes
CREATE POLICY "quotes_buyer_update" ON public.quotes
  FOR UPDATE USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Admin can manage all quotes
CREATE POLICY "quotes_admin_all" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- QUOTE_REPLIES RLS
-- ============================================================================

-- Anyone can read quote replies (suppliers' offers)
CREATE POLICY "quote_replies_public_read" ON public.quote_replies
  FOR SELECT USING (true);

-- Supplier can create replies to quotes
CREATE POLICY "quote_replies_supplier_insert" ON public.quote_replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Supplier can update their own replies
CREATE POLICY "quote_replies_supplier_update" ON public.quote_replies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Quote owner (buyer) can accept/reject replies
CREATE POLICY "quote_replies_buyer_update" ON public.quote_replies
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND buyer_id = auth.uid())
  );

-- Admin can manage all quote replies
CREATE POLICY "quote_replies_admin_all" ON public.quote_replies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- REVIEWS RLS
-- ============================================================================

-- Anyone can read published reviews
CREATE POLICY "reviews_public_read_published" ON public.reviews
  FOR SELECT USING (is_published = true);

-- Authenticated users can create reviews
CREATE POLICY "reviews_authenticated_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND buyer_id = auth.uid());

-- Review authors can update their own reviews
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Admin can manage all reviews
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- FAVORITES RLS
-- ============================================================================

-- Users can read their own favorites
CREATE POLICY "favorites_read_own" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

-- Authenticated users can add favorites
CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- Admin can manage all favorites
CREATE POLICY "favorites_admin_all" ON public.favorites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- MESSAGES RLS
-- ============================================================================

-- Users can read messages where they are sender or recipient
CREATE POLICY "messages_read_own" ON public.messages
  FOR SELECT USING (
    from_user_id = auth.uid()
    OR to_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can send messages
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND from_user_id = auth.uid());

-- Recipients can update messages (mark as read)
CREATE POLICY "messages_update_recipient" ON public.messages
  FOR UPDATE USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Admin can manage all messages
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- NOTIFICATIONS RLS
-- ============================================================================

-- Users can read their own notifications
CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- System/functions can create notifications (service role handles this)
CREATE POLICY "notifications_authenticated_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin can manage all notifications
CREATE POLICY "notifications_admin_all" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- BADGE_TYPES RLS
-- ============================================================================

-- Public read for active badge types
CREATE POLICY "badge_types_public_read" ON public.badge_types
  FOR SELECT USING (is_active = true);

-- Admin can manage badge types
CREATE POLICY "badge_types_admin_all" ON public.badge_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- BADGE_REQUESTS RLS
-- ============================================================================

-- Supplier owners can read their own badge requests
CREATE POLICY "badge_requests_read_own" ON public.badge_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier owners can create badge requests
CREATE POLICY "badge_requests_insert_own" ON public.badge_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Admin can manage badge requests (approve/reject)
CREATE POLICY "badge_requests_admin_all" ON public.badge_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- SUPPLIER_BADGES RLS
-- ============================================================================

-- Public read for active badges
CREATE POLICY "supplier_badges_public_read" ON public.supplier_badges
  FOR SELECT USING (is_active = true);

-- Admin can manage supplier badges
CREATE POLICY "supplier_badges_admin_all" ON public.supplier_badges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- AD_TYPES RLS
-- ============================================================================

-- Public read for active ad types
CREATE POLICY "ad_types_public_read" ON public.ad_types
  FOR SELECT USING (is_active = true);

-- Admin can manage ad types
CREATE POLICY "ad_types_admin_all" ON public.ad_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- AD_REQUESTS RLS
-- ============================================================================

-- Public read for active ads
CREATE POLICY "ad_requests_public_read_active" ON public.ad_requests
  FOR SELECT USING (status = 'active');

-- Supplier owners can read their own ad requests (all statuses)
CREATE POLICY "ad_requests_read_own" ON public.ad_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Supplier owners can create ad requests
CREATE POLICY "ad_requests_insert_own" ON public.ad_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Supplier owners can update their own ad requests
CREATE POLICY "ad_requests_update_own" ON public.ad_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      JOIN public.profiles p ON p.id = s.user_id
      WHERE s.id = supplier_id AND p.id = auth.uid()
    )
  );

-- Admin can manage ad requests (approve/reject)
CREATE POLICY "ad_requests_admin_all" ON public.ad_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ============================================================================
-- FUNCTION: Auto-create profile on auth.users insert
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, phone, avatar_url, role, locale, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'DZD')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- FUNCTION: Auto-update product_count on supplier when products change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suppliers
    SET product_count = product_count + 1
    WHERE id = NEW.supplier_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.suppliers
    SET product_count = GREATEST(0, product_count - 1)
    WHERE id = OLD.supplier_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If supplier_id changed
    IF OLD.supplier_id IS DISTINCT FROM NEW.supplier_id THEN
      UPDATE public.suppliers
      SET product_count = GREATEST(0, product_count - 1)
      WHERE id = OLD.supplier_id;

      UPDATE public.suppliers
      SET product_count = product_count + 1
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_change ON public.products;
CREATE TRIGGER on_product_change
  AFTER INSERT OR DELETE OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_count();


-- ============================================================================
-- FUNCTION: Auto-update review_count and rating on supplier when reviews change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.supplier_id IS NOT NULL AND NEW.is_published = true THEN
    UPDATE public.suppliers
    SET
      review_count = review_count + 1,
      rating = (
        SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
        FROM public.reviews r
        WHERE r.supplier_id = NEW.supplier_id AND r.is_published = true
      )
    WHERE id = NEW.supplier_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.supplier_id IS NOT NULL AND OLD.is_published = true THEN
    UPDATE public.suppliers
    SET
      review_count = GREATEST(0, review_count - 1),
      rating = COALESCE(
        (SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
         FROM public.reviews r
         WHERE r.supplier_id = OLD.supplier_id AND r.is_published = true),
        0.0
      )
    WHERE id = OLD.supplier_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If is_published changed for a supplier review
    IF NEW.supplier_id IS NOT NULL AND (OLD.is_published IS DISTINCT FROM NEW.is_published OR OLD.rating IS DISTINCT FROM NEW.rating) THEN
      UPDATE public.suppliers
      SET
        review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.supplier_id = NEW.supplier_id AND r.is_published = true),
        rating = COALESCE(
          (SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
           FROM public.reviews r
           WHERE r.supplier_id = NEW.supplier_id AND r.is_published = true),
          0.0
        )
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR DELETE OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_rating();


-- ============================================================================
-- FUNCTION: Auto-update order total_sales on supplier when order is delivered
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_order_supplier_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      UPDATE public.suppliers
      SET total_sales = total_sales + 1
      WHERE id = NEW.supplier_id;
    ELSIF OLD.status = 'delivered' AND NEW.status != 'delivered' THEN
      UPDATE public.suppliers
      SET total_sales = GREATEST(0, total_sales - 1)
      WHERE id = OLD.supplier_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'delivered' THEN
      UPDATE public.suppliers
      SET total_sales = total_sales + 1
      WHERE id = NEW.supplier_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_change ON public.orders;
CREATE TRIGGER on_order_change
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_order_supplier_sales();


-- ============================================================================
-- FUNCTION: Generic updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that have updated_at
DROP TRIGGER IF EXISTS update_updated_at_column ON public.profiles;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.suppliers;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.products;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.orders;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.quotes;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.badge_requests;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.badge_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_updated_at_column ON public.ad_requests;
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON public.ad_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- FUNCTION: Auto-activate supplier_badges when badge_request is approved
-- ============================================================================
CREATE OR REPLACE FUNCTION public.activate_badge_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.supplier_badges (supplier_id, badge_type_id, activated_at, expires_at, is_active)
    VALUES (NEW.supplier_id, NEW.badge_type_id, NOW(), NOW() + INTERVAL '1 year', true)
    ON CONFLICT (supplier_id, badge_type_id) DO UPDATE
    SET activated_at = NOW(), expires_at = NOW() + INTERVAL '1 year', is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_badge_request_change ON public.badge_requests;
CREATE TRIGGER on_badge_request_change
  AFTER UPDATE ON public.badge_requests
  FOR EACH ROW EXECUTE FUNCTION public.activate_badge_on_approval();


-- ============================================================================
-- SEED DATA
-- ============================================================================


-- ============================================================================
-- SEED: Badge Types (5)
-- ============================================================================
INSERT INTO public.badge_types (name, name_en, slug, icon, color, description, description_en, price, is_active) VALUES
('مورد موثوق', 'Verified Supplier', 'verified', 'shield-check', '#16a34a',
 'مورد موثوق ومعتمد بعد التحقق من بياناته ووثائقه',
 'A verified and trusted supplier after document verification', 0, true),

('مورد مميز', 'Premium Supplier', 'premium', 'crown', '#d97706',
 'مورد مميز يقدم خدمات ومنتجات عالية الجودة',
 'A premium supplier offering high quality products and services', 5000, true),

('أفضل بائع', 'Top Seller', 'top_seller', 'trophy', '#dc2626',
 'من أكثر الموردين مبيعًا على المنصة',
 'One of the highest selling suppliers on the platform', 3000, true),

('شحن مجاني', 'Free Shipping', 'free_shipping', 'truck', '#2563eb',
 'يقدم شحنًا مجانيًا على جميع الطلبات',
 'Offers free shipping on all orders', 2000, true),

('ضمان الجودة', 'Quality Guarantee', 'quality_guarantee', 'award', '#7c3aed',
 'جميع المنتجات مضمونة الجودة مع سياسة إرجاع مرنة',
 'All products are quality guaranteed with flexible return policy', 4000, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en, icon = EXCLUDED.icon,
  color = EXCLUDED.color, description = EXCLUDED.description,
  description_en = EXCLUDED.description_en, price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;


-- ============================================================================
-- SEED: Ad Types (5)
-- ============================================================================
INSERT INTO public.ad_types (name, name_en, slug, placement_type, description, price, is_active) VALUES
('إعلان البانر الرئيسي', 'Main Banner Ad', 'main_banner', 'banner',
 'إعلان بانر كبير في الصفحة الرئيسية', 15000, true),

('قسم المنتجات المميزة', 'Featured Section Ad', 'featured_section', 'featured',
 'عرض المنتج في قسم المنتجات المميزة', 8000, true),

('تعزيز المنتج', 'Product Boost', 'product_boost', 'product_boost',
 'رفع ترتيب المنتج في نتائج البحث', 5000, true),

('إعلان القسم', 'Category Ad', 'category_ad', 'category',
 'إعلان مميز داخل قسم معين', 10000, true),

('إعلان الشريط الجانبي', 'Sidebar Ad', 'sidebar_ad', 'sidebar',
 'إعلان في الشريط الجانبي للصفحات', 3000, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en,
  placement_type = EXCLUDED.placement_type, description = EXCLUDED.description,
  price = EXCLUDED.price, is_active = EXCLUDED.is_active;


-- ============================================================================
-- SEED: Categories (11) with Arabic/French names
-- ============================================================================
INSERT INTO public.categories (name, name_en, slug, icon, description, description_en, sort_order) VALUES
('الإلكترونيات والتكنولوجيا', 'Electronics & Technology', 'electronics', 'monitor-smartphone',
 'أجهزة إلكترونية، أجهزة كمبيوتر، هواتف، وأجهزة منزلية ذكية',
 'Electronic devices, computers, phones, and smart home appliances', 1),

('المواد الغذائية والمشروبات', 'Food & Beverages', 'food_beverage', 'utensils-crossed',
 'مواد غذائية بالجملة، مشروبات، منتجات غذائية للمطاعم والفنادق',
 'Wholesale food products, beverages, and food supplies for restaurants and hotels', 2),

('المطاعم والفنادق', 'Restaurant & Hotel Supplies', 'restaurant_hotel', 'utensils',
 'مستلزمات المطاعم، الفنادق، والمقاهي من أدوات وأثاث ومعدات',
 'Restaurant, hotel, and cafe supplies including tools, furniture, and equipment', 3),

('المعدات الصناعية', 'Industrial Equipment', 'industrial_equipment', 'factory',
 'آلات ومعدات صناعية، أدوات ورش، ومعدات ثقيلة',
 'Industrial machines and equipment, workshop tools, and heavy machinery', 4),

('مستلزمات المكاتب', 'Office Supplies', 'office_supplies', 'briefcase',
 'أدوات مكتبية، أثاث مكتبي، طابعات، وأجهزة تقنية مكتبية',
 'Office tools, office furniture, printers, and office technology', 5),

('المستلزمات الطبية', 'Medical Supplies', 'medical', 'heart-pulse',
 'معدات وأجهزة طبية، أدوية، مستلزمات مستشفيات وعيادات',
 'Medical equipment and devices, pharmaceuticals, hospital and clinic supplies', 6),

('البناء والتشييد', 'Construction & Building', 'construction', 'hard-hat',
 'مواد بناء، أسمنت، حديد، أدوات بناء، ومعدات هندسية',
 'Building materials, cement, steel, construction tools, and engineering equipment', 7),

('الأزياء والمنسوجات', 'Fashion & Textiles', 'fashion', 'shirt',
 'أقمشة، ملابس جاهزة، أحذية، وإكسسوارات بالجملة',
 'Fabrics, ready-made clothing, shoes, and wholesale accessories', 8),

('الزراعة والبيطرة', 'Agriculture & Veterinary', 'agriculture', 'sprout',
 'أسمدة، بذور، معدات زراعية، أعلاف، ومستلزمات بيطرية',
 'Fertilizers, seeds, agricultural equipment, animal feed, and veterinary supplies', 9),

('النقل والشحن', 'Transport & Logistics', 'transport', 'truck',
 'سيارات نقل، معدات شحن، قطع غيار، وخدمات لوجستية',
 'Transport vehicles, shipping equipment, spare parts, and logistics services', 10),

('الخدمات المهنية', 'Professional Services', 'services', 'handshake',
 'خدمات استشارية، تقنية، تسويقية، وقانونية للشركات',
 'Consulting, technology, marketing, and legal services for businesses', 11)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en, icon = EXCLUDED.icon,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order;


-- ============================================================================
-- SEED: Subcategories (2-4 per category = ~33 total)
-- ============================================================================

-- 1. Electronics subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'electronics'), 'أجهزة الكمبيوتر', 'Computers & Laptops', 'computers', 'laptop', 1),
((SELECT id FROM public.categories WHERE slug = 'electronics'), 'الهواتف الذكية', 'Smartphones', 'smartphones', 'smartphone', 2),
((SELECT id FROM public.categories WHERE slug = 'electronics'), 'الأجهزة المنزلية الذكية', 'Smart Home', 'smart-home', 'home', 3),
((SELECT id FROM public.categories WHERE slug = 'electronics'), 'الطابعات والتصوير', 'Printers & Scanners', 'printers', 'printer', 4)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 2. Food & Beverages subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'food_beverage'), 'المواد الغذائية الجافة', 'Dry Food Products', 'dry-food', 'package', 1),
((SELECT id FROM public.categories WHERE slug = 'food_beverage'), 'المشروبات والمياه', 'Beverages & Water', 'beverages', 'cup-soda', 2),
((SELECT id FROM public.categories WHERE slug = 'food_beverage'), 'المنتجات الغذائية المبردة', 'Refrigerated Products', 'refrigerated', 'snowflake', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 3. Restaurant & Hotel subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'restaurant_hotel'), 'أدوات المطبخ', 'Kitchen Tools', 'kitchen-tools', 'chef-hat', 1),
((SELECT id FROM public.categories WHERE slug = 'restaurant_hotel'), 'أثاث المطاعم', 'Restaurant Furniture', 'restaurant-furniture', 'armchair', 2),
((SELECT id FROM public.categories WHERE slug = 'restaurant_hotel'), 'أدوات المائدة', 'Tableware', 'tableware', 'glass-water', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 4. Industrial Equipment subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'industrial_equipment'), 'الآلات والمضخات', 'Machines & Pumps', 'machines', 'cog', 1),
((SELECT id FROM public.categories WHERE slug = 'industrial_equipment'), 'الأدوات اليدوية', 'Hand Tools', 'hand-tools', 'wrench', 2),
((SELECT id FROM public.categories WHERE slug = 'industrial_equipment'), 'المعدات الكهربائية', 'Electrical Equipment', 'electrical', 'zap', 3),
((SELECT id FROM public.categories WHERE slug = 'industrial_equipment'), 'معدات السلامة', 'Safety Equipment', 'safety', 'hard-hat', 4)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 5. Office Supplies subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'office_supplies'), 'الأدوات المكتبية', 'Office Tools', 'office-tools', 'pen-tool', 1),
((SELECT id FROM public.categories WHERE slug = 'office_supplies'), 'الأثاث المكتبي', 'Office Furniture', 'office-furniture', 'building-2', 2),
((SELECT id FROM public.categories WHERE slug = 'office_supplies'), 'القرطاسية', 'Stationery', 'stationery', 'pencil', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 6. Medical Supplies subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'medical'), 'الأجهزة الطبية', 'Medical Devices', 'medical-devices', 'stethoscope', 1),
((SELECT id FROM public.categories WHERE slug = 'medical'), 'المستلزمات الطبية', 'Medical Consumables', 'medical-consumables', 'package-open', 2),
((SELECT id FROM public.categories WHERE slug = 'medical'), 'أدوات الوقاية', 'Protective Equipment', 'protective-gear', 'shield', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 7. Construction subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'construction'), 'مواد البناء', 'Building Materials', 'building-materials', 'brick-wall', 1),
((SELECT id FROM public.categories WHERE slug = 'construction'), 'الحديد والمعادن', 'Steel & Metals', 'steel-metals', 'anvil', 2),
((SELECT id FROM public.categories WHERE slug = 'construction'), 'أدوات البناء', 'Construction Tools', 'construction-tools', 'hammer', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 8. Fashion & Textiles subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'fashion'), 'الأقمشة', 'Fabrics', 'fabrics', 'scissors', 1),
((SELECT id FROM public.categories WHERE slug = 'fashion'), 'الملابس الجاهزة', 'Ready-made Clothing', 'clothing', 'shirt', 2),
((SELECT id FROM public.categories WHERE slug = 'fashion'), 'الأحذية والحقائب', 'Shoes & Bags', 'shoes-bags', 'footprints', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 9. Agriculture subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'agriculture'), 'الأسمدة والبذور', 'Fertilizers & Seeds', 'fertilizers-seeds', 'sprout', 1),
((SELECT id FROM public.categories WHERE slug = 'agriculture'), 'المعدات الزراعية', 'Agricultural Equipment', 'agricultural-equipment', 'tractor', 2),
((SELECT id FROM public.categories WHERE slug = 'agriculture'), 'المستلزمات البيطرية', 'Veterinary Supplies', 'veterinary', 'heart-pulse', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 10. Transport subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'transport'), 'قطع الغيار', 'Spare Parts', 'spare-parts', 'settings', 1),
((SELECT id FROM public.categories WHERE slug = 'transport'), 'الإطارات والبطاريات', 'Tires & Batteries', 'tires-batteries', 'disc', 2),
((SELECT id FROM public.categories WHERE slug = 'transport'), 'معدات الشحن', 'Shipping Equipment', 'shipping-equipment', 'package', 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- 11. Professional Services subcategories
INSERT INTO public.subcategories (category_id, name, name_en, slug, icon, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug = 'services'), 'الخدمات التقنية', 'Technology Services', 'tech-services', 'code', 1),
((SELECT id FROM public.categories WHERE slug = 'services'), 'خدمات التسويق', 'Marketing Services', 'marketing-services', 'megaphone', 2),
((SELECT id FROM public.categories WHERE slug = 'services'), 'الخدمات الاستشارية', 'Consulting Services', 'consulting', 'lightbulb', 3)
ON CONFLICT (category_id, slug) DO NOTHING;


-- ============================================================================
-- SEED: Sample Profiles (Admin + 8 Suppliers + 2 Buyers)
-- ============================================================================
INSERT INTO public.profiles (id, username, display_name, email, phone, avatar_url, role, locale, currency) VALUES
-- Admin
('10000000-0000-0000-0000-000000000000', 'admin', 'مدير النظام', 'admin@businfo.dz', '+213-21-00-0000',
 NULL, 'admin', 'ar', 'DZD'),

-- Supplier 1
('a0000000-0000-0000-0000-000000000001', 'alraedah', 'شركة الرائدة للتجارة', 'info@alraedah.dz', '+213-21-123-456',
 'https://placehold.co/200x200/16a34a/white?text=AR&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 2
('a0000000-0000-0000-0000-000000000002', 'techvision', 'تك فيجن للإلكترونيات', 'sales@techvision.dz', '+213-21-234-567',
 'https://placehold.co/200x200/2563eb/white?text=TV&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 3
('a0000000-0000-0000-0000-000000000003', 'nadafoods', 'مؤسسة ندى للأغذية', 'contact@nadafoods.dz', '+213-21-345-678',
 'https://placehold.co/200x200/f97316/white?text=NF&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 4
('a0000000-0000-0000-0000-000000000004', 'royaltextile', 'الملكية للمنسوجات', 'info@royaltextile.dz', '+213-21-456-789',
 'https://placehold.co/200x200/ec4899/white?text=RT&font=raleway', 'supplier', 'fr', 'DZD'),

-- Supplier 5
('a0000000-0000-0000-0000-000000000005', 'safachem', 'شركة سافا الكيميائية', 'sales@safachem.dz', '+213-21-567-890',
 'https://placehold.co/200x200/14b8a6/white?text=SC&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 6
('a0000000-0000-0000-0000-000000000006', 'smartcode', 'سمارت كود للتقنية', 'hello@smartcode.dz', '+213-21-678-901',
 'https://placehold.co/200x200/6366f1/white?text=SC&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 7
('a0000000-0000-0000-0000-000000000007', 'alnoor-medical', 'النور للمستلزمات الطبية', 'info@alnoormedical.dz', '+213-21-789-012',
 'https://placehold.co/200x200/06b6d4/white?text=AN&font=raleway', 'supplier', 'ar', 'DZD'),

-- Supplier 8
('a0000000-0000-0000-0000-000000000008', 'autozone', 'أوتو زون لقطع الغيار', 'sales@autozone.dz', '+213-21-890-123',
 'https://placehold.co/200x200/ef4444/white?text=AZ&font=raleway', 'supplier', 'ar', 'DZD'),

-- Buyer 1
('b0000000-0000-0000-0000-000000000001', 'buyer1', 'أحمد بن علي', 'ahmed@email.com', '+213-55-111-2222',
 NULL, 'buyer', 'ar', 'DZD'),

-- Buyer 2
('b0000000-0000-0000-0000-000000000002', 'buyer2', 'Jean Dupont', 'jean@email.com', '+213-55-333-4444',
 NULL, 'buyer', 'fr', 'EUR')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username, display_name = EXCLUDED.display_name,
  email = EXCLUDED.email, phone = EXCLUDED.phone, avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role, locale = EXCLUDED.locale, currency = EXCLUDED.currency;


-- ============================================================================
-- SEED: Suppliers (8 sample suppliers)
-- ============================================================================
INSERT INTO public.suppliers (user_id, name, name_en, description, description_en, logo_url, cover_url, category, phone, whatsapp, email, address, address_en, city, country, rating, review_count, product_count, total_sales, views, is_verified, status) VALUES
-- Supplier 1: Al Raedah - Construction
('a0000000-0000-0000-0000-000000000001',
 'شركة الرائدة للتجارة', 'Al Raedah Trading Co.',
 'شركة رائدة في مجال مواد البناء والتشييد مع أكثر من 20 عامًا من الخبرة. نقدم أفضل المنتجات بأسعار تنافسية مع خدمة توصيل سريعة لجميع الولايات.',
 'A leading company in construction materials with over 20 years of experience. Best products at competitive prices with fast delivery to all wilayas.',
 'https://placehold.co/200x200/16a34a/white?text=AR&font=raleway',
 'https://placehold.co/1200x400/15803d/white?text=Al+Raedah+Trading',
 'construction', '+213-21-123-456', '+213-55-123-456', 'info@alraedah.dz',
 'الجزائر العاصمة، حي الجزائر الوسطى', 'Algiers, Centre Ville',
 'الجزائر العاصمة', 'DZ', 4.7, 45, 3, 120, 5600, true, 'active'),

-- Supplier 2: Tech Vision - Electronics
('a0000000-0000-0000-0000-000000000002',
 'تك فيجن للإلكترونيات', 'Tech Vision Electronics',
 'موزع معتمد لأكبر العلامات التجارية في الإلكترونيات. نوفر حلول متكاملة للشركات والمؤسسات مع ضمان شامل وخدمة ما بعد البيع.',
 'Authorized distributor for the largest electronics brands. Integrated solutions for companies with comprehensive warranty and after-sales service.',
 'https://placehold.co/200x200/2563eb/white?text=TV&font=raleway',
 'https://placehold.co/1200x400/1d4ed8/white?text=Tech+Vision',
 'electronics', '+213-21-234-567', '+213-55-234-567', 'sales@techvision.dz',
 'وهران، حي ماركيط', 'Oran, Marcket District',
 'وهران', 'DZ', 4.5, 32, 3, 85, 4200, true, 'active'),

-- Supplier 3: Nada Foods - Food & Beverages
('a0000000-0000-0000-0000-000000000003',
 'مؤسسة ندى للأغذية', 'Nada Foods Est.',
 'متخصصون في توريد المواد الغذائية للمطاعم والفنادق والمؤسسات. نوفر منتجات عالية الجودة بأسعار جملة مميزة مع التوصيل اليومي.',
 'Specialists in supplying food products to restaurants, hotels and institutions. High quality products at special wholesale prices with daily delivery.',
 'https://placehold.co/200x200/f97316/white?text=NF&font=raleway',
 'https://placehold.co/1200x400/ea580c/white?text=Nada+Foods',
 'food_beverage', '+213-21-345-678', '+213-55-345-678', 'contact@nadafoods.dz',
 'الجزائر العاصمة، حي باب الزوار', 'Algiers, Bab Ezzouar',
 'الجزائر العاصمة', 'DZ', 4.3, 28, 3, 200, 3800, false, 'active'),

-- Supplier 4: Royal Textile - Fashion
('a0000000-0000-0000-0000-000000000004',
 'الملكية للمنسوجات', 'Royal Textile',
 'Un des plus grands exportateurs de tissus en Algérie. Large gamme de tissus de qualité pour les usines et les boutiques de mode à des prix compétitifs.',
 'One of the largest fabric exporters in Algeria. Wide range of quality fabrics for factories and fashion stores at competitive prices.',
 'https://placehold.co/200x200/ec4899/white?text=RT&font=raleway',
 'https://placehold.co/1200x400/db2777/white?text=Royal+Textile',
 'fashion', '+213-21-456-789', '+213-55-456-789', 'info@royaltextile.dz',
 'قسنطينة، حي علي منجلي', 'Constantine, Ali Mendjeli',
 'قسنطينة', 'DZ', 4.6, 38, 3, 150, 4900, true, 'active'),

-- Supplier 5: Safa Chemicals - Industrial
('a0000000-0000-0000-0000-000000000005',
 'شركة سافا الكيميائية', 'Safa Chemicals Co.',
 'مورد رئيسي للمواد الكيميائية الصناعية والزراعية في المنطقة. نعمل مع أكبر المصانع والشركات لتوفير حلول كيميائية متخصصة.',
 'A leading supplier of industrial and agricultural chemicals. Working with the largest factories and companies to provide specialized chemical solutions.',
 'https://placehold.co/200x200/14b8a6/white?text=SC&font=raleway',
 'https://placehold.co/1200x400/0d9488/white?text=Safa+Chemicals',
 'industrial_equipment', '+213-21-567-890', '+213-55-567-890', 'sales@safachem.dz',
 'عنابة، المنطقة الصناعية', 'Annaba, Industrial Zone',
 'عنابة', 'DZ', 4.4, 22, 3, 65, 3100, true, 'active'),

-- Supplier 6: Smart Code - Services
('a0000000-0000-0000-0000-000000000006',
 'سمارت كود للتقنية', 'Smart Code Technology',
 'شركة تقنية رائدة تقدم حلول برمجية متكاملة وأنظمة إدارة الأعمال وحلول السحابة للشركات والمؤسسات في جميع القطاعات.',
 'A leading technology company providing integrated software solutions, ERP systems, and cloud solutions for businesses in all sectors.',
 'https://placehold.co/200x200/6366f1/white?text=SC&font=raleway',
 'https://placehold.co/1200x400/4f46e5/white?text=Smart+Code',
 'services', '+213-21-678-901', '+213-55-678-901', 'hello@smartcode.dz',
 'سطيف، حي 1000 مسكن', 'Setif, 1000 Logements',
 'سطيف', 'DZ', 4.8, 18, 3, 45, 2800, true, 'active'),

-- Supplier 7: Al Noor Medical - Medical
('a0000000-0000-0000-0000-000000000007',
 'النور للمستلزمات الطبية', 'Al Noor Medical Supplies',
 'مورد معتمد للمستلزمات والأجهزة الطبية للمستشفيات والعيادات والصيدليات. نوفر أحدث التقنيات الطبية مع خدمة صيانة متخصصة.',
 'Authorized supplier of medical supplies and equipment for hospitals, clinics, and pharmacies. Latest medical technologies with specialized maintenance.',
 'https://placehold.co/200x200/06b6d4/white?text=AN&font=raleway',
 'https://placehold.co/1200x400/0891b2/white?text=Al+Noor+Medical',
 'medical', '+213-21-789-012', '+213-55-789-012', 'info@alnoormedical.dz',
 'البليدة، حي بوعندان', 'Blida, Bouandane',
 'البليدة', 'DZ', 4.9, 52, 3, 180, 5200, true, 'active'),

-- Supplier 8: Auto Zone - Transport
('a0000000-0000-0000-0000-000000000008',
 'أوتو زون لقطع الغيار', 'Auto Zone Parts',
 'أكبر مركز لبيع قطع الغيار الأصلية والمعتمدة لجميع أنواع السيارات. نقدم ضمانًا على جميع منتجاتنا مع خدمة تركيب احترافية.',
 'The largest center for selling original and certified spare parts for all vehicle types. Warranty on all products with professional installation service.',
 'https://placehold.co/200x200/ef4444/white?text=AZ&font=raleway',
 'https://placehold.co/1200x400/dc2626/white?text=Auto+Zone',
 'transport', '+213-21-890-123', '+213-55-890-123', 'sales@autozone.dz',
 'الجزائر العاصمة، حي حسين داي', 'Algiers, Hussein Dey',
 'الجزائر العاصمة', 'DZ', 4.2, 35, 3, 95, 4500, false, 'active')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name, name_en = EXCLUDED.name_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  logo_url = EXCLUDED.logo_url, cover_url = EXCLUDED.cover_url,
  category = EXCLUDED.category, phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp,
  email = EXCLUDED.email, address = EXCLUDED.address, address_en = EXCLUDED.address_en,
  city = EXCLUDED.city, country = EXCLUDED.country,
  rating = EXCLUDED.rating, review_count = EXCLUDED.review_count,
  total_sales = EXCLUDED.total_sales, views = EXCLUDED.views,
  is_verified = EXCLUDED.is_verified, status = EXCLUDED.status;


-- ============================================================================
-- SEED: Products (24 - 3 per supplier)
-- ============================================================================

-- Supplier 1: Al Raedah - Construction Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'إسمنت بورتلاندي 50 كجم', 'Portland Cement 50kg', 'portland-cement-50kg',
 'إسمنت بورتلاندي عالي الجودة مناسب لجميع أعمال البناء والتشييد. مطابق للمواصفات الجزائرية NA 442.',
 'High quality Portland cement suitable for all construction works. Compliant with Algerian standards NA 442.',
 950.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'construction'),
 (SELECT id FROM public.subcategories WHERE slug = 'building-materials'),
 100, 'كيس', true, 5000, true, 1200, 85, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'حديد تسليح 12 مم', 'Rebar 12mm', 'rebar-12mm',
 'حديد تسليح قياسي مقاوم للصدأ بطول 12 متر. مناسب للأساسات والأسقف والجدران المسلحة.',
 'Standard anti-corrosion rebar, 12 meters length. Suitable for foundations, roofs, and reinforced walls.',
 280.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'construction'),
 (SELECT id FROM public.subcategories WHERE slug = 'steel-metals'),
 500, 'قطعة', true, 10000, false, 850, 72, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'طوب أحمر معياري', 'Standard Red Brick', 'standard-red-brick',
 'طوب أحمر معياري عالي الجودة للبناء. أبعاد منتظمة ومقاومة عالية للضغط.',
 'High quality standard red brick for construction. Regular dimensions and high compressive strength.',
 28.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'construction'),
 (SELECT id FROM public.subcategories WHERE slug = 'building-materials'),
 5000, 'قطعة', true, 100000, false, 600, 60, 'active');


-- Supplier 2: Tech Vision - Electronics Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 'شاشة عرض LED 55 بوصة', 'LED Display Screen 55 inch', 'led-display-55-inch',
 'شاشة عرض احترافية بدقة 4K UHD مناسبة للمؤتمرات والمعارض والمحال التجارية. تضم تقنية HDR.',
 'Professional 4K UHD display screen suitable for conferences, exhibitions, and retail stores. Features HDR technology.',
 165000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'electronics'),
 (SELECT id FROM public.subcategories WHERE slug = 'computers'),
 5, 'قطعة', true, 50, true, 950, 18, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 'نظام إنذار حماية متكامل', 'Integrated Security Alarm System', 'security-alarm-system',
 'نظام إنذار حماية ذكي مع كاميرات مراقبة 4K وتطبيق جوال للتحكم عن بعد. يشمل تركيب مجاني.',
 'Smart security alarm system with 4K surveillance cameras and mobile remote control app. Includes free installation.',
 124000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'electronics'),
 (SELECT id FROM public.subcategories WHERE slug = 'smart-home'),
 3, 'طقم', true, 30, true, 780, 25, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 'طابعة ليزر متعددة الوظائف', 'Multi-function Laser Printer', 'laser-printer-mfp',
 'طابعة ليزر متعددة الوظائف: طباعة، مسح ضوئي، نسخ. سرعة 30 صفحة/دقيقة. مناسبة للمكاتب.',
 'Multi-function laser printer: print, scan, copy. Speed 30 pages/min. Suitable for offices.',
 45000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'electronics'),
 (SELECT id FROM public.subcategories WHERE slug = 'printers'),
 2, 'قطعة', true, 25, false, 520, 12, 'active');


-- Supplier 3: Nada Foods - Food & Beverage Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 'زيت طعام نباتي 18 لتر', 'Vegetable Cooking Oil 18L', 'cooking-oil-18l',
 'زيت طعام نباتي عالي الجاءة مناسب للمطاعم والفنادق والمخابز. معتمد من وزارة التجارة.',
 'High quality vegetable cooking oil suitable for restaurants, hotels, and bakeries. Approved by the Ministry of Commerce.',
 13000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'food_beverage'),
 (SELECT id FROM public.subcategories WHERE slug = 'dry-food'),
 20, 'تنكة', true, 500, true, 1100, 150, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 'أرز بسمتي 25 كجم', 'Basmati Rice 25kg', 'basmati-rice-25kg',
 'أرز بسمتي طويل الحبة ممتاز مستورد من باكستان. مثالي للمطاعم والمناسبات.',
 'Premium long grain Basmati rice imported from Pakistan. Perfect for restaurants and events.',
 9500.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'food_beverage'),
 (SELECT id FROM public.subcategories WHERE slug = 'dry-food'),
 50, 'كيس', true, 300, false, 870, 120, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 'قهوة تركية فاخرة 1 كجم', 'Premium Turkish Coffee 1kg', 'turkish-coffee-1kg',
 'قهوة تركية فاخرة محمصة ومطحونة بعناية. مثالية للمقاهي والمطاعم.',
 'Premium Turkish coffee carefully roasted and ground. Ideal for cafes and restaurants.',
 5500.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'food_beverage'),
 (SELECT id FROM public.subcategories WHERE slug = 'beverages'),
 10, 'كيس', true, 200, true, 920, 95, 'active');


-- Supplier 4: Royal Textile - Fashion Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'),
 'قماش قطن خام 150 سم', 'Raw Cotton Fabric 150cm', 'raw-cotton-fabric-150cm',
 'قماش قطن خام عالي الجودة بعرض 150 سم. مثالي للمصانع والمصممين.',
 'High quality raw cotton fabric, 150cm width. Ideal for factories and designers.',
 2100.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'fashion'),
 (SELECT id FROM public.subcategories WHERE slug = 'fabrics'),
 500, 'متر', true, 20000, false, 680, 55, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'),
 'حرير صناعي فاخر', 'Premium Artificial Silk', 'premium-artificial-silk',
 'حرير صناعي فاخر بدرجات لونية متعددة. مثالي لفساتين الزفاف والمناسبات.',
 'Premium artificial silk available in multiple colors. Ideal for wedding dresses and occasions.',
 4200.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'fashion'),
 (SELECT id FROM public.subcategories WHERE slug = 'fabrics'),
 200, 'متر', true, 5000, true, 890, 40, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'),
 'قماش جينز صناعي', 'Denim Fabric', 'denim-fabric',
 'قماش جينز صناعي متين بوزن 12 أونصة. متوفر بألوان متعددة.',
 'Durable 12oz denim fabric. Available in multiple colors.',
 1800.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'fashion'),
 (SELECT id FROM public.subcategories WHERE slug = 'fabrics'),
 300, 'متر', true, 15000, false, 540, 35, 'active');


-- Supplier 5: Safa Chemicals - Industrial Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000005'),
 'مادة مذيبة صناعية 200 لتر', 'Industrial Solvent 200L', 'industrial-solvent-200l',
 'مادة مذيبة صناعية عالية النقاء للدهانات والطلاء. منتج ألماني معتمد.',
 'High purity industrial solvent for paints and coatings. Certified German product.',
 59000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'industrial_equipment'),
 (SELECT id FROM public.subcategories WHERE slug = 'machines'),
 10, 'برميل', true, 100, false, 450, 20, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000005'),
 'أسمدة عضوية 25 كجم', 'Organic Fertilizer 25kg', 'organic-fertilizer-25kg',
 'أسمدة عضوية طبيعية للمزارع والحدائق. غنية بالعناصر الغذائية الأساسية.',
 'Natural organic fertilizer for farms and gardens. Rich in essential nutrients.',
 5000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'agriculture'),
 (SELECT id FROM public.subcategories WHERE slug = 'fertilizers-seeds'),
 100, 'كيس', true, 2000, true, 720, 85, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000005'),
 'مواد تنظيف صناعية 20 لتر', 'Industrial Cleaning Chemicals 20L', 'industrial-cleaning-20l',
 'مواد تنظيف صناعية متخصصة للمصانع والورش. فعالة ضد الشحوم والزيوت.',
 'Specialized industrial cleaning chemicals for factories and workshops. Effective against grease and oil.',
 8000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'industrial_equipment'),
 (SELECT id FROM public.subcategories WHERE slug = 'hand-tools'),
 20, 'جالون', true, 500, false, 380, 30, 'active');


-- Supplier 6: Smart Code - Technology Services
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000006'),
 'نظام إدارة موارد المؤسسات ERP', 'ERP System License', 'erp-system-license',
 'نظام إدارة موارد المؤسسات متكامل يشمل المحاسبة والمخزون والموارد البشرية وإدارة المبيعات.',
 'Integrated ERP system including accounting, inventory, HR management, and sales management.',
 3000000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'services'),
 (SELECT id FROM public.subcategories WHERE slug = 'tech-services'),
 1, 'رخصة', true, NULL, true, 1050, 15, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000006'),
 'تطبيق جوال مخصص', 'Custom Mobile App Development', 'custom-mobile-app',
 'تصميم وتطوير تطبيق جوال احترافي لنظامي iOS و Android. يشمل التصميم والتطوير والنشر.',
 'Professional mobile app design and development for iOS and Android. Includes design, development, and deployment.',
 1650000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'services'),
 (SELECT id FROM public.subcategories WHERE slug = 'tech-services'),
 1, 'مشروع', true, NULL, true, 880, 12, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000006'),
 'خدمات استضافة سحابية', 'Cloud Hosting Services', 'cloud-hosting',
 'خدمات استضافة سحابية بسرعة عالية ودعم فني متواصل 24/7. مساحة تخزين غير محدودة.',
 'High-speed cloud hosting services with 24/7 technical support. Unlimited storage.',
 19900.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'services'),
 (SELECT id FROM public.subcategories WHERE slug = 'tech-services'),
 1, 'شهريًا', true, NULL, false, 620, 35, 'active');


-- Supplier 7: Al Noor Medical - Medical Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'قفازات طبية معقمة (علبة 100)', 'Sterile Medical Gloves (Box of 100)', 'medical-gloves-100',
 'قفازات طبية معقمة من النتريل. مقاومة للثقب ومريحة للاستخدام المطول.',
 'Sterile nitrile medical gloves. Puncture resistant and comfortable for extended use.',
 3000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'medical'),
 (SELECT id FROM public.subcategories WHERE slug = 'medical-consumables'),
 50, 'علبة', true, 1000, true, 1350, 200, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'جهاز قياس ضغط الدم الرقمي', 'Digital Blood Pressure Monitor', 'bp-monitor-digital',
 'جهاز قياس ضغط الدم الرقمي دقيق وسهل الاستخدام. شاشة كبيرة مع ذاكرة 120 قراءة.',
 'Accurate and easy-to-use digital blood pressure monitor. Large screen with 120 reading memory.',
 21000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'medical'),
 (SELECT id FROM public.subcategories WHERE slug = 'medical-devices'),
 10, 'قطعة', true, 80, true, 980, 40, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'كمامات طبية FFP2 (علبة 50)', 'FFP2 Medical Masks (Box of 50)', 'ffp2-masks-50',
 'كمامات طبية FFP2 معتمدة عالية الفلترة. حماية فعالة ضد الجسيمات والرذاذ.',
 'Certified high-filtration FFP2 medical masks. Effective protection against particles and droplets.',
 5600.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'medical'),
 (SELECT id FROM public.subcategories WHERE slug = 'protective-gear'),
 100, 'علبة', true, 2000, false, 750, 180, 'active');


-- Supplier 8: Auto Zone - Transport Products
INSERT INTO public.products (supplier_id, name, name_en, slug, description, description_en, price, currency, category_id, subcategory_id, min_order, unit, in_stock, stock_quantity, is_featured, views, total_sales, status) VALUES
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000008'),
 'فلتر زيت أصلي', 'Genuine Oil Filter', 'genuine-oil-filter',
 'فلتر زيت أصلي عالي الجودة مناسب لمعظم السيارات. عمر افتراضي 15000 كم.',
 'High quality genuine oil filter suitable for most vehicles. Service life 15,000 km.',
 4300.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'transport'),
 (SELECT id FROM public.subcategories WHERE slug = 'spare-parts'),
 20, 'قطعة', true, 500, false, 580, 45, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000008'),
 'إطارات سيارات 17 بوصة', 'Car Tires 17 inch', 'car-tires-17-inch',
 'إطارات عالية الجودة مناسبة لجميع السيارات. مقاومة للتآكل مع أداء ممتاز على الطرق.',
 'High quality tires suitable for all vehicles. Wear resistant with excellent road performance.',
 30000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'transport'),
 (SELECT id FROM public.subcategories WHERE slug = 'tires-batteries'),
 4, 'قطعة', true, 200, true, 820, 65, 'active'),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000008'),
 'بطارية سيارة 70 أمبير', 'Car Battery 70 Amp', 'car-battery-70amp',
 'بطارية سيارة طويلة العمر 70 أمبير مع ضمان سنتين. لا تحتاج صيانة.',
 'Long-life car battery 70 amp with 2-year warranty. Maintenance free.',
 25000.00, 'DZD',
 (SELECT id FROM public.categories WHERE slug = 'transport'),
 (SELECT id FROM public.subcategories WHERE slug = 'tires-batteries'),
 5, 'قطعة', true, 100, false, 690, 38, 'active');


-- ============================================================================
-- SEED: Product Images (multiple per product)
-- ============================================================================
-- We'll add images for the first product of each supplier as example
INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
-- Al Raedah - Cement
((SELECT id FROM public.products WHERE slug = 'portland-cement-50kg'),
 'https://placehold.co/400x400/94a3b8/white?text=Cement+50kg&font=raleway', 'إسمنت بورتلاندي 50 كجم', 0, true),
((SELECT id FROM public.products WHERE slug = 'portland-cement-50kg'),
 'https://placehold.co/400x400/64748b/white?text=Cement+Side&font=raleway', 'إسمنت بورتلاندي - جانبي', 1, false),

-- Tech Vision - LED Screen
((SELECT id FROM public.products WHERE slug = 'led-display-55-inch'),
 'https://placehold.co/400x400/2563eb/white?text=LED+55%22&font=raleway', 'شاشة LED 55 بوصة', 0, true),
((SELECT id FROM public.products WHERE slug = 'led-display-55-inch'),
 'https://placehold.co/400x400/1d4ed8/white?text=LED+Back&font=raleway', 'شاشة LED - خلفية', 1, false),

-- Nada Foods - Cooking Oil
((SELECT id FROM public.products WHERE slug = 'cooking-oil-18l'),
 'https://placehold.co/400x400/f97316/white?text=Oil+18L&font=raleway', 'زيت طعام 18 لتر', 0, true),

-- Royal Textile - Cotton Fabric
((SELECT id FROM public.products WHERE slug = 'raw-cotton-fabric-150cm'),
 'https://placehold.co/400x400/ec4899/white?text=Cotton&font=raleway', 'قماش قطن خام 150 سم', 0, true),

-- Safa Chemicals - Solvent
((SELECT id FROM public.products WHERE slug = 'industrial-solvent-200l'),
 'https://placehold.co/400x400/14b8a6/white?text=Solvent&font=raleway', 'مادة مذيبة صناعية', 0, true),

-- Smart Code - ERP
((SELECT id FROM public.products WHERE slug = 'erp-system-license'),
 'https://placehold.co/400x400/6366f1/white?text=ERP+System&font=raleway', 'نظام ERP', 0, true),

-- Al Noor Medical - Gloves
((SELECT id FROM public.products WHERE slug = 'medical-gloves-100'),
 'https://placehold.co/400x400/06b6d4/white?text=Gloves&font=raleway', 'قفازات طبية', 0, true),

-- Auto Zone - Oil Filter
((SELECT id FROM public.products WHERE slug = 'genuine-oil-filter'),
 'https://placehold.co/400x400/ef4444/white?text=Oil+Filter&font=raleway', 'فلتر زيت أصلي', 0, true);


-- ============================================================================
-- SEED: Product Variations (sample for a few products)
-- ============================================================================
-- Security Alarm System - variations
INSERT INTO public.product_variations (product_id, variation_type, variation_value, sku, price_override, stock_quantity) VALUES
((SELECT id FROM public.products WHERE slug = 'security-alarm-system'),
 'size', '4 كاميرات', 'SAS-4CAM', NULL, 15),
((SELECT id FROM public.products WHERE slug = 'security-alarm-system'),
 'size', '8 كاميرات', 'SAS-8CAM', 45000.00, 10),
((SELECT id FROM public.products WHERE slug = 'security-alarm-system'),
 'size', '16 كاميرا', 'SAS-16CAM', 120000.00, 5);

-- Artificial Silk - color variations
INSERT INTO public.product_variations (product_id, variation_type, variation_value, sku, price_override, stock_quantity) VALUES
((SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'),
 'color', 'أبيض', 'SILK-WHT', NULL, 1000),
((SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'),
 'color', 'أحمر', 'SILK-RED', NULL, 800),
((SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'),
 'color', 'أسود', 'SILK-BLK', NULL, 900),
((SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'),
 'color', 'ذهبي', 'SILK-GLD', 500.00, 500);


-- ============================================================================
-- SEED: Sample Reviews
-- ============================================================================
INSERT INTO public.reviews (product_id, supplier_id, buyer_id, rating, title, comment, is_published) VALUES
-- Reviews for Al Raedah
((SELECT id FROM public.products WHERE slug = 'portland-cement-50kg'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'b0000000-0000-0000-0000-000000000001', 5, 'جودة ممتازة',
 'إسمنت عالي الجودة، التوصيل كان سريعًا والمنتج مطابق للمواصفات. سأطلب مرة أخرى بالتأكيد.', true),

((SELECT id FROM public.products WHERE slug = 'rebar-12mm'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'b0000000-0000-0000-0000-000000000002', 4, 'منتج جيد',
 'حديد جيد الجودة والسعر مناسب. فقط تأخر التوصيل يومين عن الموعد المتوقع.', true),

-- Reviews for Tech Vision
((SELECT id FROM public.products WHERE slug = 'led-display-55-inch'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 'b0000000-0000-0000-0000-000000000001', 5, 'شاشة رائعة',
 'جودة الصورة ممتازة والدعم الفني متعاون. أنصح بها بشدة للمؤتمرات والمعارض.', true),

-- Reviews for Nada Foods
((SELECT id FROM public.products WHERE slug = 'cooking-oil-18l'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 'b0000000-0000-0000-0000-000000000002', 4, 'زيت جيد',
 'الزيت جيد والسعر مناسب جداً مقارنة بالسوق. خدمة التوصيل ممتازة.', true),

-- Reviews for Al Noor Medical
((SELECT id FROM public.products WHERE slug = 'medical-gloves-100'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'b0000000-0000-0000-0000-000000000001', 5, 'قفازات ممتازة',
 'جودة عالية جداً وسعر ممتاز. القفازات مريحة ومناسبة للاستخدام الطويل. أوفرها دائماً.', true),

((SELECT id FROM public.products WHERE slug = 'bp-monitor-digital'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'b0000000-0000-0000-0000-000000000002', 5, 'جهاز دقيق ومريح',
 'الجهاز دقيق جداً وسهل الاستخدام. الشاشة كبيرة وواضحة والذاكرة ممتازة.', true),

-- Review for Smart Code
((SELECT id FROM public.products WHERE slug = 'erp-system-license'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000006'),
 'b0000000-0000-0000-0000-000000000001', 4, 'نظام متكامل',
 'نظام ERP شامل وسهل الاستخدام. فريق الدعم الفني متعاون ومتجاوب. أنصح به.', true),

-- Review for Royal Textile
((SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'),
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'),
 'b0000000-0000-0000-0000-000000000002', 5, 'قماش فاخر',
 'الحرير الصناعي ممتاز وجودة عالية جداً. الألوان رائعة والسعر مناسب جداً.', true);


-- ============================================================================
-- SEED: Sample Orders
-- ============================================================================
INSERT INTO public.orders (id, buyer_id, supplier_id, status, total_amount, currency, notes, shipping_address, created_at) VALUES
('c0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 'delivered', 95000.00, 'DZD',
 'يرجى التوصيل في الصباح', 'الجزائر العاصمة، حي باب الزوار، بناية 15',
 '2025-01-15 10:30:00+01'),

('c0000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 'shipped', 165000.00, 'DZD',
 'يرجى الاتصال قبل التوصيل', 'وهران، حي ماركيط، شارع 20 أوت',
 '2025-02-01 14:20:00+01'),

('c0000000-0000-0000-0000-000000000003',
 'b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 'confirmed', 260000.00, 'DZD',
 'طلب منتظم شهري', 'الجزائر العاصمة، حي باب الزوار، بناية 15',
 '2025-02-20 09:15:00+01'),

('c0000000-0000-0000-0000-000000000004',
 'b0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 'pending', 30000.00, 'DZD',
 NULL, 'قسنطينة، حي علي منجلي',
 '2025-03-01 11:45:00+01')
ON CONFLICT (id) DO NOTHING;

-- Order Items
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
('c0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.products WHERE slug = 'portland-cement-50kg'),
 'إسمنت بورتلاندي 50 كجم', 100, 950.00, 95000.00),

('c0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.products WHERE slug = 'led-display-55-inch'),
 'شاشة عرض LED 55 بوصة', 1, 165000.00, 165000.00),

('c0000000-0000-0000-0000-000000000003',
 (SELECT id FROM public.products WHERE slug = 'cooking-oil-18l'),
 'زيت طعام نباتي 18 لتر', 20, 13000.00, 260000.00),

('c0000000-0000-0000-0000-000000000004',
 (SELECT id FROM public.products WHERE slug = 'bp-monitor-digital'),
 'جهاز قياس ضغط الدم الرقمي', 1, 21000.00, 21000.00),

('c0000000-0000-0000-0000-000000000004',
 (SELECT id FROM public.products WHERE slug = 'medical-gloves-100'),
 'قفازات طبية معقمة (علبة 100)', 3, 3000.00, 9000.00);


-- ============================================================================
-- SEED: Sample Quotes (RFQ)
-- ============================================================================
INSERT INTO public.quotes (id, buyer_id, title, description, category_id, quantity, unit, budget_min, budget_max, currency, deadline, status) VALUES
('d0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'طلب عرض سعر: مواد بناء لمشروع سكني',
 'نحتاج مواد بناء لمشروع سكني يتكون من 20 وحدة سكنية. نحتاج إسمنت وحديد وطوب بكميات كبيرة مع توصيل شهري.',
 (SELECT id FROM public.categories WHERE slug = 'construction'),
 1, 'مشروع', 5000000.00, 15000000.00, 'DZD', '2025-06-30', 'open'),

('d0000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000002',
 'طلب عرض سعر: أجهزة طبية لعيادة',
 'نحتاج تزويد عيادة جديدة بأجهزة طبية أساسية تشمل: أجهزة قياس ضغط، ترمومترات، ستيتوسكوبات، وقفازات.',
 (SELECT id FROM public.categories WHERE slug = 'medical'),
 1, 'مجموعة', 500000.00, 2000000.00, 'DZD', '2025-05-15', 'open'),

('d0000000-0000-0000-0000-000000000003',
 'b0000000-0000-0000-0000-000000000001',
 'طلب عرض سعر: مستلزمات مطعم',
 'نحتاج توريد مستلزمات مطعم جديد بسعة 100 مقعد. مواد غذائية وأدوات مطبخ وأدوات مائدة.',
 (SELECT id FROM public.categories WHERE slug = 'food_beverage'),
 1, 'شحنة', 300000.00, 800000.00, 'DZD', '2025-04-30', 'replied')
ON CONFLICT (id) DO NOTHING;

-- Quote Replies
INSERT INTO public.quote_replies (quote_id, supplier_id, price_per_unit, currency, message, delivery_time, status) VALUES
('d0000000-0000-0000-0000-000000000003',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 650000.00, 'DZD',
 'نستطيع تزويدكم بجميع المستلزمات المطلوبة بأسعار تنافسية مع التوصيل خلال 3 أيام عمل.',
 '3 أيام عمل', 'pending'),

('d0000000-0000-0000-0000-000000000003',
 (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000003'),
 720000.00, 'DZD',
 'عرض شامل يشمل جميع المنتجات الغذائية والأدوات مع خصم 10% على الطلب الأول.',
 '5 أيام عمل', 'accepted');


-- ============================================================================
-- SEED: Sample Messages
-- ============================================================================
INSERT INTO public.messages (conversation_id, from_user_id, to_user_id, subject, body, message_type, created_at) VALUES
-- Conversation 1: Product inquiry
('e0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 'استفسار عن الإسمنت',
 'مرحبًا، أريد الاستفسار عن إمكانية توريد 500 كيس إسمنت بورتلاندي مع توصيل لعين الدفلى. ما هو السعر النهائي مع التوصيل؟',
 'product_inquiry', '2025-03-01 10:00:00+01'),

('e0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001',
 'رد: استفسار عن الإسمنت',
 'مرحبًا بك، شكرًا لتواصلكم. نستطيع توريد 500 كيس بسعر 920 دج للكيس مع توصيل مجاني لعين الدفلى خلال 48 ساعة.',
 'general', '2025-03-01 11:30:00+01'),

-- Conversation 2: General inquiry
('e0000000-0000-0000-0000-000000000002',
 'b0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000007',
 'استفسار عن الأجهزة الطبية',
 'مرحبًا، هل لديكم جهاز قياس سكر الدم؟ وما هي العلامات التجارية المتوفرة؟',
 'product_inquiry', '2025-03-05 14:20:00+01'),

('e0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000007',
 'b0000000-0000-0000-0000-000000000002',
 'رد: استفسار عن الأجهزة الطبية',
 'مرحبًا، نعم لدينا أجهزة قياس سكر من عدة علامات تجارية: Accu-Chek, OneTouch, و Contour. الأسعار تبدأ من 8500 دج. هل تفضل زيارة معرضنا؟',
 'general', '2025-03-05 15:45:00+01'),

-- Conversation 3: Badge request inquiry
('e0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000000',
 'طلب شارة مورد مميز',
 'مرحبًا، أريد التقدم للحصول على شارة المورد المميز. لدينا أكثر من 30 منتج ونقيمنا 4.5. هل يمكنكم المساعدة؟',
 'badge_request', '2025-03-10 09:00:00+01');


-- ============================================================================
-- SEED: Sample Notifications
-- ============================================================================
INSERT INTO public.notifications (user_id, title, body, type, action_url, is_read) VALUES
-- Buyer 1 notifications
('b0000000-0000-0000-0000-000000000001',
 'تم تأكيد طلبك', 'تم تأكيد طلبك #c0000000 من شركة الرائدة للتجارة. سيتم الشحن قريبًا.',
 'order', '/orders/c0000000-0000-0000-0000-000000000001', false),

('b0000000-0000-0000-0000-000000000001',
 'رد جديد على عرض سعرك', 'تم الرد على طلب عرض سعر مواد البناء من شركة سافا الكيميائية.',
 'quote', '/quotes/d0000000-0000-0000-0000-000000000001', false),

-- Buyer 2 notifications
('b0000000-0000-0000-0000-000000000002',
 'تم شحن طلبك', 'تم شحن طلبك #c0000000 من تك فيجن للإلكترونيات. رقم التتبع: TRK-2025-001.',
 'order', '/orders/c0000000-0000-0000-0000-000000000002', true),

-- Admin notifications
('10000000-0000-0000-0000-000000000000',
 'طلب شارة جديد', 'تقدمت شركة تك فيجن بطلب للحصول على شارة مورد مميز.',
 'badge', '/admin/badge-requests', false),

('10000000-0000-0000-0000-000000000000',
 'مورد جديد مسجل', 'تم تسجيل مورد جديد: شركة الرائدة للتجارة.',
 'system', '/admin/suppliers', true);


-- ============================================================================
-- SEED: Sample Favorites
-- ============================================================================
INSERT INTO public.favorites (user_id, product_id, supplier_id, created_at) VALUES
-- Buyer 1 favorites
('b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.products WHERE slug = 'portland-cement-50kg'), NULL, '2025-02-01'),
('b0000000-0000-0000-0000-000000000001',
 NULL, (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'), '2025-02-05'),
('b0000000-0000-0000-0000-000000000001',
 (SELECT id FROM public.products WHERE slug = 'medical-gloves-100'), NULL, '2025-02-10'),

-- Buyer 2 favorites
('b0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.products WHERE slug = 'premium-artificial-silk'), NULL, '2025-01-20'),
('b0000000-0000-0000-0000-000000000002',
 NULL, (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'), '2025-01-22'),
('b0000000-0000-0000-0000-000000000002',
 (SELECT id FROM public.products WHERE slug = 'erp-system-license'), NULL, '2025-02-15');


-- ============================================================================
-- SEED: Sample Badge Requests (require admin approval)
-- ============================================================================
INSERT INTO public.badge_requests (supplier_id, badge_type_id, status, message, admin_note) VALUES
-- Al Raedah requests Verified badge (auto-approved seed data)
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 (SELECT id FROM public.badge_types WHERE slug = 'verified'),
 'approved', 'نطلب شارة المورد الموثوق. لدينا جميع الوثائق المطلوبة.', 'تم التحقق والقبول'),

-- Tech Vision requests Premium badge (pending)
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 (SELECT id FROM public.badge_types WHERE slug = 'premium'),
 'pending', 'نحن موزع معتمد لعدة علامات تجارية عالمية ونلبي المعايير المطلوبة.', NULL),

-- Al Noor Medical requests Quality Guarantee badge (pending)
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 (SELECT id FROM public.badge_types WHERE slug = 'quality_guarantee'),
 'pending', 'جميع منتجاتنا معتمدة من وزارة الصحة ومطابقة للمعايير الدولية.', NULL);


-- ============================================================================
-- SEED: Sample Supplier Badges (from approved requests)
-- ============================================================================
INSERT INTO public.supplier_badges (supplier_id, badge_type_id, activated_at, expires_at, is_active) VALUES
-- Al Raedah has Verified badge
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 (SELECT id FROM public.badge_types WHERE slug = 'verified'),
 '2025-01-01 00:00:00+01', '2026-01-01 00:00:00+01', true),

-- Al Noor Medical has Verified + Top Seller badges
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 (SELECT id FROM public.badge_types WHERE slug = 'verified'),
 '2024-10-01 00:00:00+01', '2025-10-01 00:00:00+01', true),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 (SELECT id FROM public.badge_types WHERE slug = 'top_seller'),
 '2025-01-15 00:00:00+01', '2026-01-15 00:00:00+01', true),

-- Smart Code has Verified badge
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000006'),
 (SELECT id FROM public.badge_types WHERE slug = 'verified'),
 '2024-12-01 00:00:00+01', '2025-12-01 00:00:00+01', true),

-- Safa Chemicals has Verified badge
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000005'),
 (SELECT id FROM public.badge_types WHERE slug = 'verified'),
 '2025-02-01 00:00:00+01', '2026-02-01 00:00:00+01', true)
ON CONFLICT (supplier_id, badge_type_id) DO NOTHING;


-- ============================================================================
-- SEED: Sample Ad Requests (require admin approval)
-- ============================================================================
INSERT INTO public.ad_requests (supplier_id, ad_type_id, title, description, image_url, target_url, status, message, start_date, end_date, impressions, clicks) VALUES
-- Active ads (already approved)
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001'),
 (SELECT id FROM public.ad_types WHERE slug = 'main_banner'),
 'عرض خاص: مواد بناء بأسعار المصنع',
 'احصل على خصم 15% على جميع مواد البناء عند الطلب المباشر. التوصيل مجاني للطلبات فوق 100,000 دج.',
 'https://placehold.co/1200x400/15803d/white?text=Al+Raedah+Special+Offer&font=raleway',
 '/supplier/' || (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000001')::TEXT,
 'active', 'عرض لمدة 3 أشهر', '2025-01-01', '2025-03-31', 12500, 890),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007'),
 (SELECT id FROM public.ad_types WHERE slug = 'featured_section'),
 'مستلزمات طبية بأعلى معايير الجودة',
 'توريد مستلزمات طبية للمستشفيات والعيادات والصيدليات مع ضمان الجودة وأفضل الأسعار.',
 'https://placehold.co/800x400/0891b2/white?text=Al+Noor+Medical&font=raleway',
 '/supplier/' || (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000007')::TEXT,
 'active', 'إعلان مميز لمدة شهرين', '2025-02-01', '2025-04-30', 9200, 710),

-- Pending ads (waiting admin approval)
((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000002'),
 (SELECT id FROM public.ad_types WHERE slug = 'product_boost'),
 'تعزيز: نظام إنذار حماية متكامل',
 'نظام إنذار حماية ذكي مع كاميرات مراقبة 4K وتطبيق جوال. خصم 10% لفترة محدودة.',
 NULL,
 '/product/' || (SELECT id FROM public.products WHERE slug = 'security-alarm-system')::TEXT,
 'pending', 'أريد تعزيز هذا المنتج في نتائج البحث لمدة شهر', '2025-03-15', '2025-04-15', 0, 0),

((SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004'),
 (SELECT id FROM public.ad_types WHERE slug = 'category_ad'),
 'أقمشة فاخرة بأسعار تنافسية',
 'تشكيلة واسعة من الأقمشة الفاخرة للمصممين والمصانع. توصيل لجميع الولايات.',
 NULL,
 '/supplier/' || (SELECT id FROM public.suppliers WHERE user_id = 'a0000000-0000-0000-0000-000000000004')::TEXT,
 'pending', 'إعلان في قسم الأزياء والمنسوجات', '2025-04-01', '2025-06-30', 0, 0);


-- ============================================================================
-- DONE! Schema and seed data complete.
-- ============================================================================
-- Summary:
--   - 20 tables created with proper constraints and indexes
--   - RLS enabled on all tables with comprehensive policies
--   - 5 functions and 10+ triggers for automation
--   - 5 badge types, 5 ad types seeded
--   - 11 categories with 33 subcategories seeded
--   - 8 suppliers with 24 products seeded
--   - Product images and variations seeded
--   - Reviews, orders, quotes, messages, notifications seeded
--   - Favorites, badge requests, supplier badges, ad requests seeded
-- ============================================================================
