/**
 * cartUtils.ts
 * LocalStorage tabanlı misafir sepet yönetimi ve Supabase senkronizasyonu.
 */

import { createClient } from '@/app/utils/supabase/client'
import { LocalCartItem } from '@/app/types'

const CART_KEY = 'tc_gift_shop_cart'

// ============================================================
// LocalStorage CRUD
// ============================================================

/** localStorage'dan misafir sepetini okur */
export function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalCartItem[]
  } catch {
    return []
  }
}

/** localStorage'a misafir sepetini yazar */
export function setLocalCart(items: LocalCartItem[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

/**
 * Misafir sepetine ürün ekler.
 * Aynı product_id + variant_id kombinasyonu varsa quantity arttırır.
 */
export function addToLocalCart(item: LocalCartItem): LocalCartItem[] {
  const cart = getLocalCart()
  const existingIndex = cart.findIndex(
    (c) => c.product_id === item.product_id && c.variant_id === item.variant_id
  )

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity
  } else {
    cart.push(item)
  }

  setLocalCart(cart)
  return cart
}

/**
 * LocalStorage sepetinden belirli ürünü (product_id + variant_id) kaldırır
 */
export function removeFromLocalCart(productId: number, variantId: number | null): LocalCartItem[] {
  const cart = getLocalCart().filter(
    (c) => !(c.product_id === productId && c.variant_id === variantId)
  )
  setLocalCart(cart)
  return cart
}

/**
 * LocalStorage sepetinde miktar günceller.
 * quantity <= 0 ise ürünü kaldırır.
 */
export function updateLocalCartQuantity(
  productId: number,
  variantId: number | null,
  quantity: number
): LocalCartItem[] {
  let cart = getLocalCart()
  if (quantity <= 0) {
    return removeFromLocalCart(productId, variantId)
  }
  cart = cart.map((c) =>
    c.product_id === productId && c.variant_id === variantId ? { ...c, quantity } : c
  )
  setLocalCart(cart)
  return cart
}

/** LocalStorage sepetini tamamen temizler */
export function clearLocalCart(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
}

/** LocalStorage'daki toplam ürün sayısını döner (adet toplamı) */
export function getLocalCartCount(): number {
  return getLocalCart().reduce((sum, item) => sum + item.quantity, 0)
}

// ============================================================
// Supabase Senkronizasyon
// ============================================================

/**
 * Giriş yapıldıktan sonra localStorage sepetini Supabase'e aktarır.
 * - Zaten DB'de olan ürün+varyant kombinasyonu varsa quantity ekler
 * - Yoksa yeni satır oluşturur
 * - İşlem sonrası localStorage'ı temizler
 */
export async function syncLocalCartToSupabase(userId: string): Promise<void> {
  const localItems = getLocalCart()
  if (localItems.length === 0) return

  const supabase = createClient()

  // Mevcut DB sepetini al
  const { data: existingItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)

  const existing = existingItems || []

  // Her local öğe için upsert mantığı
  for (const localItem of localItems) {
    const match = existing.find(
      (db) => db.product_id === localItem.product_id && db.variant_id === localItem.variant_id
    )

    if (match) {
      // Zaten varsa quantity'yi topla
      await supabase
        .from('cart_items')
        .update({ quantity: match.quantity + localItem.quantity })
        .eq('id', match.id)
    } else {
      // Yoksa yeni ekle
      await supabase.from('cart_items').insert({
        user_id: userId,
        product_id: localItem.product_id,
        variant_id: localItem.variant_id,
        quantity: localItem.quantity,
      })
    }
  }

  // Local sepeti temizle
  clearLocalCart()
}
