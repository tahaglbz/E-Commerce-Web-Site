import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ContactEmailTemplate } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactRequestBody {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequestBody = await request.json();

    // Validasyon
    if (!body.senderName || !body.senderEmail || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur.' },
        { status: 400 }
      );
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.senderEmail)) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta formatı.' },
        { status: 400 }
      );
    }

    // HTML şablonunu oluştur
    const emailHtml = ContactEmailTemplate({
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      subject: body.subject,
      message: body.message,
    });

    // Resend'e gönder
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Sandbox test adresi
      to: 'tahaglbz1@gmail.com', // Sandbox - sadece hesabı açan maile
      replyTo: body.senderEmail, // Yanıt adresi olarak gönderenin maili
      subject: `[İletişim Formu] ${body.subject}`,
      html: emailHtml,
    });

    // Response kontrolü
    if (error || !data?.id) {
      throw new Error(error?.message || 'Email API hatası: Yanıt ID bulunamadı');
    }

    // Başarılı yanıt
    return NextResponse.json(
      {
        success: true,
        message: 'Mesajınız başarıyla gönderildi!',
        messageId: data.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form API Error:', error);

    return NextResponse.json(
      {
        error: 'Mesaj gönderme sırasında bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
