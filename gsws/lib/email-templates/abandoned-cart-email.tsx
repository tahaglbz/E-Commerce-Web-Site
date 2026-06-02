import { Product, ProductVariant } from '@/app/types';

export interface CartItemDisplay {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
}

export interface AbandonedCartEmailProps {
  customerName: string;
  customerEmail: string;
  items: CartItemDisplay[];
  totalValue: number;
}

export const AbandonedCartEmailTemplate = ({
  customerName,
  customerEmail,
  items,
  totalValue,
}: AbandonedCartEmailProps) => {
  const itemsHtml = items
    .map(
      (item) => `
    <div style="padding: 15px; background: #27272a; border-radius: 8px; margin: 12px 0; display: flex; gap: 15px;">
      <!-- Ürün Resmi -->
      <div style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: #3f3f46;">
        ${
          item.variant?.color_image_url || item.product.image_url
            ? `<img src="${item.variant?.color_image_url || item.product.image_url}" alt="${item.product.title}" style="width: 100%; height: 100%; object-fit: cover;" />`
            : `<div style="width: 100%; height: 100%; background: #3f3f46; display: flex; align-items: center; justify-content: center; color: #71717a;">📦</div>`
        }
      </div>

      <!-- Ürün Detayı -->
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${item.product.title}</h4>
        
        ${
          item.variant
            ? `
          <div style="color: #a1a1a6; font-size: 12px; margin: 4px 0;">
            ${item.variant.color ? `<span>🎨 Renk: <strong>${item.variant.color}</strong></span><br />` : ''}
            ${item.variant.size_or_dimension ? `<span>📏 Boyut: <strong>${item.variant.size_or_dimension}</strong></span>` : ''}
          </div>
        `
            : ''
        }

        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #ec4899; font-size: 13px; font-weight: 600;">Adet: ${item.quantity}</span>
          <span style="color: #ec4899; font-size: 14px; font-weight: 700;">₺${(
            (item.variant
              ? (item.product.is_discount_active
                  ? item.product.discount_price || item.product.price
                  : item.product.price) + item.variant.additional_price
              : item.product.is_discount_active
                ? item.product.discount_price || item.product.price
                : item.product.price) * item.quantity
          ).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sepetinizde Ürün Unuttunuz!</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #09090b;">
    <div style="background: #09090b; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🛒 Sepetinizde Ürün Unuttunuz!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 25px;">
          <p style="margin: 0 0 10px 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">Merhaba <strong>${customerName}</strong>,</p>

          <p style="margin: 0 0 25px 0; color: #a1a1a6; font-size: 13px; line-height: 1.6;">
            Sepetinizdeki ürünleri göz ardı etmiş olabilirsiniz. 
            Aşağıdaki öğeler hala siparişiniz için beklemede.
          </p>

          <!-- Ürünler Listesi -->
          <div style="margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📦 Sepetinizdeki Ürünler</h3>
            ${itemsHtml}
          </div>

          <!-- Toplam -->
          <div style="background: #27272a; border-top: 2px solid #3f3f46; border-bottom: 2px solid #3f3f46; padding: 15px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #a1a1a6; font-size: 14px; font-weight: 600;">Sepet Toplamı:</span>
              <span style="color: #ec4899; font-size: 18px; font-weight: 700;">₺${totalValue.toFixed(2)}</span>
            </div>
          </div>

          <!-- Promosyon -->
          <div style="background: #1f2937; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #f59e0b; font-size: 13px; font-weight: 600;">⏰ Sınırlı Zamanlı Fırsat!</p>
            <p style="margin: 8px 0 0 0; color: #d4d4d8; font-size: 13px; line-height: 1.5;">
              Hemen siparişinizi tamamlayın ve sepetinizi kaydedin. Stok limitli olabilir!
            </p>
          </div>

          <!-- CTA Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://tcgiftshop.com/cart" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 10px; width: 100%; box-sizing: border-box;">🛍️ Sepetinizi Tamamla</a>
          </div>

          <!-- Alternatif İletişim -->
          <p style="margin: 15px 0; color: #a1a1a6; font-size: 12px; text-align: center; line-height: 1.5;">
            Sorunuz varsa
            <a href="mailto:tahaglbz1@gmail.com" style="color: #ec4899; text-decoration: none; font-weight: 600;">bize ulaşın</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #27272a; padding: 20px; text-align: center; border-top: 1px solid #3f3f46;">
          <p style="margin: 0; color: #71717a; font-size: 12px;">TC Gift Shop - E-Ticaret Hizmetleri</p>
          <p style="margin: 5px 0 0 0; color: #71717a; font-size: 11px;">
            Bu mail
            <a href="https://tcgiftshop.com/profile" style="color: #71717a; text-decoration: none;">tercihleri düzenle</a>
            ile engellenir.
          </p>
        </div>

      </div>
    </div>
  </body>
</html>
`;
};
