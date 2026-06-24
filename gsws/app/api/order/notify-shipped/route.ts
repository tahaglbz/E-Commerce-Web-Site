import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/app/utils/supabase/server';
import { OrderShippedEmailTemplate } from '@/lib/email-templates/order-shipped-email';
import { Order } from '@/app/types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyShippedRequestBody {
  orderId: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyShippedRequestBody = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId gereklidir.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Siparişi çek
    const { data: order } = (await supabase
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single()) as { data: Order | null };

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    if (!order.customer_email) {
      return NextResponse.json(
        { error: 'Müşteri e-posta adresi bulunamadı.' },
        { status: 400 }
      );
    }

    // Takip URL'sini kargo firmasına göre oluştur
    const carrier = order.shipping_carrier || 'Kargo Firması';
    const code = order.tracking_code || '';
    let trackingUrl = '#';

    switch (carrier) {
      case 'Yurtiçi Kargo':
        trackingUrl = `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${code}`;
        break;
      case 'MNG Kargo':
        trackingUrl = `https://www.mngkargo.com.tr/wps/portal/mng/main/kargotakip?cargoKey=${code}`;
        break;
      case 'Aras Kargo':
        trackingUrl = `https://kargotakip.araskargo.com.tr/?trackNo=${code}`;
        break;
      case 'PTT Kargo':
        trackingUrl = `https://www.ptt.gov.tr/tr/subpages/kargotakip?barcode=${code}`;
        break;
      case 'Sendeo':
        trackingUrl = `https://kargotakip.sendeo.com.tr/kargo-takip-popup?gonderiNo=${code}`;
        break;
    }

    // HTML şablonunu oluştur
    const emailHtml = OrderShippedEmailTemplate({
      customerName: order.customer_name,
      orderId: order.id,
      trackingCode: code,
      shippingCarrier: carrier,
      trackingUrl: trackingUrl,
      totalPrice: order.total_price,
      shippedAt: new Date().toISOString(),
    });

    // Resend ile mail gönder
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@tcgiftshop.com',
      to: order.customer_email,
      subject: `🚚 Siparişiniz Kargoya Verildi! #${order.id}`,
      html: emailHtml,
    });

    if (!response || !('id' in response)) {
      throw new Error('Email API hatası: Yanıt ID bulunamadı');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Kargoya verildi maili başarıyla gönderildi!',
        messageId: response.id,
        orderId: order.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order Shipped Notification API Error:', error);
    return NextResponse.json(
      {
        error: 'Kargoya verildi maili gönderilirken bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
