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

export interface ProductVariant {
  id: number
  product_id: number
  variant_type: 'SIZE' | 'COLOR' | 'OTHER'
  variant_value: string
  created_at: string
}

// ============== CART TYPES ==============
export interface CartItem {
  id: number
  user_id: string
  product_id: number
  quantity: number
  selected_variants: Record<string, string> // e.g. { "SIZE": "XL", "COLOR": "Siyah" }
  created_at: string
  updated_at: string
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  total_price: number
  applied_coupon?: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  selected_variants: Record<string, string>
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
