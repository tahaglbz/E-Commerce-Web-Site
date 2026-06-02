export interface ContactEmailProps {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export const ContactEmailTemplate = ({
  senderName,
  senderEmail,
  subject,
  message,
}: ContactEmailProps) => `
<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Yeni İletişim Formu Mesajı</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #09090b;">
    <div style="background: #09090b; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">📨 Yeni İletişim Mesajı</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 25px;">
          <p style="margin: 0 0 20px 0; color: #a1a1a6; font-size: 14px; line-height: 1.6;">Yeni bir iletişim formu mesajı alındı. Aşağıdaki detayları inceleyiniz:</p>

          <!-- Gönderen Bilgileri -->
          <div style="background: #27272a; border-left: 4px solid #ec4899; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div style="margin: 10px 0;">
              <span style="color: #a1a1a6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Gönderen Adı:</span>
              <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 500;">${senderName}</p>
            </div>
            <div style="margin: 10px 0;">
              <span style="color: #a1a1a6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">E-posta Adresi:</span>
              <p style="margin: 5px 0 0 0; color: #ec4899; font-size: 14px; font-weight: 500;"><a href="mailto:${senderEmail}" style="color: #ec4899; text-decoration: none;">${senderEmail}</a></p>
            </div>
          </div>

          <!-- Konu -->
          <div style="margin: 20px 0;">
            <span style="color: #a1a1a6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Konu:</span>
            <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; font-weight: 500; background: #27272a; padding: 10px 15px; border-radius: 8px;">${subject}</p>
          </div>

          <!-- Mesaj İçeriği -->
          <div style="margin: 20px 0;">
            <span style="color: #a1a1a6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Mesaj:</span>
            <div style="margin: 8px 0 0 0; color: #d4d4d8; font-size: 14px; line-height: 1.6; background: #27272a; padding: 15px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">
${message}
            </div>
          </div>

          <!-- CTA Button -->
          <div style="margin: 30px 0; text-align: center;">
            <a href="mailto:${senderEmail}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">↩️ Yanıt Gönder</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #27272a; padding: 20px; text-align: center; border-top: 1px solid #3f3f46;">
          <p style="margin: 0; color: #71717a; font-size: 12px;">TC Gift Shop - Otomatik Sistem Maili</p>
          <p style="margin: 5px 0 0 0; color: #71717a; font-size: 11px;">Bu mail sistem tarafından otomatik olarak gönderilmiştir.</p>
        </div>

      </div>
    </div>
  </body>
</html>
`;
