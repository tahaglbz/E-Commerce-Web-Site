export interface OrderApprovedEmailProps {
  customerName: string;
  orderId: number;
  totalPrice: number;
  itemCount: number;
  approvedAt: string;
}

export const OrderApprovedEmailTemplate = ({
  customerName,
  orderId,
  totalPrice,
  itemCount,
  approvedAt,
}: OrderApprovedEmailProps) => `
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Siparişiniz Onaylandı</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #09090b;">
    <div style="background: #09090b; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🎉 Siparişiniz Onaylandı!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 25px;">
          <p style="margin: 0 0 10px 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">Merhaba <strong>${customerName}</strong>,</p>

          <p style="margin: 0 0 25px 0; color: #a1a1a6; font-size: 14px; line-height: 1.6;">
            Harika haber! Siparişiniz onaylanmış ve kargo hazırlıklarına başlanmıştır. 
            Sevkiyatınız çok yakında yolda olacak.
          </p>

          <!-- Sipariş Bilgileri Card -->
          <div style="background: #27272a; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📦 Sipariş Detayları</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #3f3f46;">
              <span style="color: #a1a1a6; font-size: 13px;">Sipariş Numarası:</span>
              <span style="color: #10b981; font-weight: 600; font-size: 13px;">#${orderId}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #3f3f46;">
              <span style="color: #a1a1a6; font-size: 13px;">Ürün Sayısı:</span>
              <span style="color: #d4d4d8; font-weight: 600; font-size: 13px;">${itemCount} ürün</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #3f3f46;">
              <span style="color: #a1a1a6; font-size: 13px;">Toplam Tutar:</span>
              <span style="color: #10b981; font-weight: 700; font-size: 14px;">₺${totalPrice.toFixed(2)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 8px 0;">
              <span style="color: #a1a1a6; font-size: 13px;">Onay Tarihi:</span>
              <span style="color: #d4d4d8; font-weight: 500; font-size: 13px;">${new Date(approvedAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          <!-- Sonraki Adım -->
          <div style="background: #1f2937; border-left: 4px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #10b981; font-size: 13px; font-weight: 600;">📬 Sonraki Adım</p>
            <p style="margin: 8px 0 0 0; color: #d4d4d8; font-size: 13px; line-height: 1.5;">
              Siparişiniz hazırlanıp, kargo takip koduyla birlikte size e-posta gönderilecektir. 
              Lütfen spam klasörünü de kontrol etmeyi unutmayın.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://tcgiftshop.com/orders" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">🚚 Kargo Takibi</a>
          </div>

          <!-- Teşekkür -->
          <div style="text-align: center; padding: 20px; background: #27272a; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #a1a1a6; font-size: 13px; line-height: 1.5;">
              TC Gift Shop'ta alışveriş yaptığınız için teşekkür ederiz! 
              <br />Sorularınız için bize ulaşabilirsiniz.
            </p>
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
