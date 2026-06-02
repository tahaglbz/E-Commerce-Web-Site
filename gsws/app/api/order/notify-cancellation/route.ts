import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/app/utils/supabase/server';
import { OrderCancelledEmailTemplate } from '@/lib/email-templates';
import { Order, OrderItem } from '@/app/types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyCancellationRequestBody {
  orderId: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyCancellationRequestBody = await request.json();

    // Validasyon
    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId gereklidir.' },
        { status: 400 }
      );
    }

    // Server Supabase client oluştur
    const supabase = await createServerSupabaseClient();

    // Siparişi çek
    const { data: order } = (await supabase
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single()) as { data: Order | null };

    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı.' },
        { status: 404 }
      );
    }

    // Siparışın müşteri e-posta adresini kontrol et
    if (!order.customer_email) {
      return NextResponse.json(
        { error: 'Müşteri e-posta adresi bulunamadı.' },
        { status: 400 }
      );
    }

    // Siparişteki öğe sayısını çek
    const { data: orderItems } = (await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', body.orderId)) as { data: OrderItem[] | null };

    const itemCount = orderItems?.length || 0;

    // HTML şablonunu oluştur
    const emailHtml = OrderCancelledEmailTemplate({
      customerName: order.customer_name,
      orderId: order.id,
      totalPrice: order.total_price,
      itemCount,
      cancelledAt: order.updated_at,
    });

    // Resend'e gönder
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@tcgiftshop.com',
      to: order.customer_email,
      subject: `⚠️ Sipariş #${order.id} İptal Edildi`,
      html: emailHtml,
    });

    // Başarılı yanıt
    return NextResponse.json(
      {
        success: true,
        message: 'Sipariş iptal bildirimi maili başarıyla gönderildi!',
        messageId: response.id,
        orderId: order.id,
        customerEmail: order.customer_email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Order Cancellation Notification API Error:', error);

    return NextResponse.json(
      {
        error: 'Sipariş iptal bildirimi gönderme sırasında bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
