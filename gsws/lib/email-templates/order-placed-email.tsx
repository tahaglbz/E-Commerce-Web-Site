export interface OrderPlacedEmailProps {
  customerName: string;
  orderId: number;
  totalPrice: number;
  itemCount: number;
}

export const OrderPlacedEmailTemplate = ({
  customerName,
  orderId,
  totalPrice,
  itemCount,
}: OrderPlacedEmailProps) => `
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Siparişiniz Alındı</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #09090b;">
    <div style="background: #09090b; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">✅ Siparişiniz Alındı!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 25px;">
          <p style="margin: 0 0 10px 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">Merhaba <strong>${customerName}</strong>,</p>

          <p style="margin: 0 0 25px 0; color: #a1a1a6; font-size: 14px; line-height: 1.6;">
            Siparişiniz başarıyla alınmıştır ve şu anda inceleme havuzunda beklemektedir. 
            Onay tamamlandığında size e-posta göndereceğiz.
          </p>

          <!-- Sipariş Bilgileri Card -->
          <div style="background: #27272a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📦 Sipariş Detayları</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #3f3f46;">
              <span style="color: #a1a1a6; font-size: 13px;">Sipariş Numarası:</span>
              <span style="color: #3b82f6; font-weight: 600; font-size: 13px;">#${orderId}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #3f3f46;">
              <span style="color: #a1a1a6; font-size: 13px;">Ürün Sayısı:</span>
              <span style="color: #d4d4d8; font-weight: 600; font-size: 13px;">${itemCount} ürün</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0;">
              <span style="color: #a1a1a6; font-size: 13px;">Toplam Tutar:</span>
              <span style="color: #3b82f6; font-weight: 700; font-size: 14px;">₺${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <!-- Durum Bilgisi -->
          <div style="background: #1f2937; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #3b82f6; font-size: 13px; font-weight: 600;">⏳ Şu Anda</p>
            <p style="margin: 8px 0 0 0; color: #d4d4d8; font-size: 13px; line-height: 1.5;">
              Siparişiniz admin tarafından incelenmektedir. Genellikle 24-48 saat içinde onaylanır.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://tcgiftshop.com/orders" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">📋 Siparişinizi Takip Edin</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #27272a; padding: 20px; text-align: center; border-top: 1px solid #3f3f46;">
          <p style="margin: 0; color: #71717a; font-size: 12px;">TC Gift Shop - Sipariş Yönetimi</p>
          <p style="margin: 5px 0 0 0; color: #71717a; font-size: 11px;">© 2024 TC Gift Shop. Tüm hakları saklıdır.</p>
        </div>

      </div>
    </div>
  </body>
</html>
`;
