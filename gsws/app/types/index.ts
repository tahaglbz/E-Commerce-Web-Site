// ============== AUTH & USER TYPES ==============
export interface User {
  id: string
  email: string
  created_at: string
}

// ============== CATEGORIES & SUB-CATEGORIES ==============
export interface Category {
  id: number
  name: string
  created_at: string
}

export interface SubCategory {
  id: number
  name: string
  category_id: number
  created_at: string
}

// ============== PRODUCT TYPES ==============
export interface Product {
  id: number
  title: string
  description: string
  price: number
  discount_price?: number | null
  is_discount_active: boolean
  type: 'PHYSICAL' | 'DIGITAL'
  category_id: number | null
  sub_category_id: number | null
  image_url: string | null
  stock: number
  created_at: string
  updated_at: string
}

// Kombinasyon bazlı varyant şeması (color_image_url yeni eklendi)
export interface ProductVariant {
  id: number
  product_id: number
  color: string | null                // Giyimde renk adı (Siyah, Beyaz...), diğerlerinde null
  color_image_url: string | null      // O renge ait tişört/ürün fotoğrafı URL'si
  size_or_dimension: string | null    // Beden (S,M,L,XL) veya boyut (A3,A4), null olabilir
  stock: number
  additional_price: number            // Ana fiyata eklenen fiyat farkı (0 = fark yok)
  created_at: string
}

// ── Giyim Kategorisi Form Tipleri ──────────────────────────────────

/** Giyim varyantında her beden satırı */
export interface SizeStockRow {
  size: string             // S, M, L, XL, XXL...
  stock: number
  additional_price: number
}

/** Giyim varyantında her renk grubu (bir renk + o renge ait bedenler) */
export interface ClothingColorGroup {
  localId: string          // React key için geçici yerel id
  color: string            // Renk adı
  colorImageFile: File | null
  colorImagePreview: string | null
  sizes: SizeStockRow[]
}

// ── Ev Dekorasyon Kategorisi Form Tipleri ─────────────────────────

/** Boyut/ebat bazlı varyant (renk yok) */
export interface DimensionVariantRow {
  size_or_dimension: string  // A3, A4, 30x40 vb.
  stock: number
  additional_price: number
}

// ── Genel Varyant Form Tipi (eski uyumluluk) ──────────────────────
export interface ProductVariantInput {
  color: string
  size_or_dimension: string
  stock: number
  additional_price: number
}

// ============== CART TYPES ==============

/** LocalStorage'da tutulan misafir sepet öğesi */
export interface LocalCartItem {
  product_id: number
  variant_id: number | null
  quantity: number
}

/** Supabase cart_items tablosu */
export interface CartItem {
  id: number
  user_id: string
  product_id: number
  variant_id: number | null
  quantity: number
  created_at: string
  updated_at: string
}

/** Sepet görünümü için birleştirilmiş tip */
export interface CartItemWithDetails extends CartItem {
  product?: Product
  variant?: ProductVariant | null
}

/** Misafir sepet öğesi genişletilmiş */
export interface LocalCartItemWithDetails extends LocalCartItem {
  product?: Product
  variant?: ProductVariant | null
}

/** Birleşik sepet öğesi (hem local hem DB) */
export interface UnifiedCartItem {
  key: string
  product_id: number
  variant_id: number | null
  quantity: number
  product?: Product
  variant?: ProductVariant | null
  source: 'local' | 'remote'
  remote_id?: number
}

export interface CartWithProduct extends CartItem {
  product?: Product
}

// ============== ORDER TYPES ==============
export interface Order {
  id: number
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  customer_address?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CANCEL_REQUESTED'
  total_price: number
  shipping_price?: number | null
  applied_coupon?: string | null
  tracking_code?: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  variant_id?: number | null
  quantity: number
  price: number
  selected_variants: Record<string, string | null>
  variant_image_url?: string | null
  variant_name?: string | null
  created_at: string
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[]
}

// ============== COUPON TYPES ==============
export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export interface Coupon {
  id: number
  code: string
  discount_type: DiscountType
  discount_value: number
  is_active: boolean
  max_uses?: number | null
  current_uses: number
  expiry_date?: string | null
  created_at: string
  updated_at: string
}

// ============== ABANDONED CART ANALYSIS ==============
export interface AbandonedCart {
  user_id: string
  customer_email: string
  cart_items: CartItem[]
  total_value: number
  abandoned_at: string
}

// ============== UI STATE TYPES ==============
export interface ModalState {
  isOpen: boolean
  productId?: number
}

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}
