interface OrderShippedEmailProps {
  customerName: string
  orderId: number
  trackingCode: string
  shippingCarrier: string
  trackingUrl: string
  totalPrice: number
  shippedAt: string
}

export function OrderShippedEmailTemplate({
  customerName,
  orderId,
  trackingCode,
  shippingCarrier,
  trackingUrl,
  totalPrice,
  shippedAt,
}: OrderShippedEmailProps): string {
  const formattedDate = new Date(shippedAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Siparişiniz Kargoya Verildi - TC Gift Shop</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#ec4899;">
                🎁 TC Gift Shop
              </h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#18181b;border:1px solid #27272a;border-radius:20px;overflow:hidden;">

              <!-- Top Banner -->
              <div style="background:linear-gradient(135deg,#ec4899 0%,#8b5cf6 50%,#3b82f6 100%);padding:40px 40px 32px;text-align:center;">
                <div style="font-size:56px;margin-bottom:16px;">🚚</div>
                <h2 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                  Siparişiniz Yola Çıktı!
                </h2>
                <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">
                  Merhaba <strong>${customerName}</strong>, paketiniz kargoya verildi.
                </p>
              </div>

              <!-- Body -->
              <div style="padding:36px 40px;">

                <!-- Sipariş Bilgisi -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr>
                    <td style="background:#27272a;border-radius:12px;padding:20px 24px;">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;">Sipariş Numarası</p>
                      <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">#${orderId}</p>
                    </td>
                  </tr>
                </table>

                <!-- Kargo Takip Bilgisi -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:2px solid #ec4899;border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="padding:24px;">
                      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#ec4899;text-transform:uppercase;letter-spacing:1px;">📦 Kargo Bilgileri</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #27272a;">
                            <span style="font-size:13px;color:#a1a1aa;">Kargo Firması</span>
                            <span style="float:right;font-size:14px;font-weight:700;color:#fff;">${shippingCarrier}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #27272a;">
                            <span style="font-size:13px;color:#a1a1aa;">Takip Kodu</span>
                            <span style="float:right;font-size:16px;font-weight:800;color:#ec4899;letter-spacing:2px;">${trackingCode}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;">
                            <span style="font-size:13px;color:#a1a1aa;">Kargoya Veriliş</span>
                            <span style="float:right;font-size:13px;color:#d4d4d8;">${formattedDate}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Takip Butonu -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr>
                    <td align="center">
                      <a
                        href="${trackingUrl}"
                        target="_blank"
                        style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.5px;"
                      >
                        📍 Kargomu Takip Et →
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Tutar -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#0a0a0a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
                      <div style="display:inline-block;">
                        <p style="margin:0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Sipariş Tutarı</p>
                        <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#fff;">${totalPrice.toFixed(2)} ₺</p>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Bilgi Notu -->
                <div style="background:#1c1c1e;border-left:3px solid #8b5cf6;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                  <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                    💡 <strong style="color:#d4d4d8;">İpucu:</strong> Kargo takip kodunuzu kargo firmasının web sitesinde veya uygulamamızda kullanabilirsiniz. Teslimat süresi genellikle 1-3 iş günüdür.
                  </p>
                </div>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a
                        href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://tcgiftshop.com'}/profile"
                        style="display:inline-block;border:1.5px solid #3f3f46;color:#a1a1aa;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;"
                      >
                        📋 Siparişlerimi Görüntüle
                      </a>
                    </td>
                  </tr>
                </table>

              </div>

              <!-- Footer -->
              <div style="border-top:1px solid #27272a;padding:24px 40px;text-align:center;">
                <p style="margin:0 0 4px;font-size:13px;color:#71717a;">
                  Bu mail <strong style="color:#a1a1aa;">TC Gift Shop</strong> tarafından gönderilmiştir.
                </p>
                <p style="margin:0;font-size:12px;color:#52525b;">
                  Sorun yaşıyorsanız <a href="mailto:destek@tcgiftshop.com" style="color:#ec4899;text-decoration:none;">destek@tcgiftshop.com</a> adresine yazın.
                </p>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
