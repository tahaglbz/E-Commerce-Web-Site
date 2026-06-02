import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerSupabaseClient } from '@/app/utils/supabase/server';
import { AbandonedCartEmailTemplate, CartItemDisplay } from '@/lib/email-templates';
import { CartItem, Product, ProductVariant } from '@/app/types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface RemindCartRequestBody {
  userId?: string;
  userEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RemindCartRequestBody = await request.json();

    // Validasyon
    if (!body.userId && !body.userEmail) {
      return NextResponse.json(
        { error: 'userId veya userEmail gereklidir.' },
        { status: 400 }
      );
    }

    // Server Supabase client oluştur
    const supabase = await createServerSupabaseClient();

    // Kullanıcı bilgilerini çek (eğer sadece email verilmişse)
    let userId = body.userId;
    let userEmail = body.userEmail;
    let customerName = 'Değerli Müşteri';

    if (!userId && userEmail) {
      userId = userEmail; // Email varsa user_id olarak kullan (auth.users ile eşleş)
    }

    // Sepetteki ürünleri çek
    const { data: cartItems } = (await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)) as { data: CartItem[] | null };

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Sepette ürün bulunamadı.' },
        { status: 404 }
      );
    }

    // Eğer email verilmemişse, orders tablosundan al
    if (!userEmail) {
      const { data: orderData } = (await supabase
        .from('orders')
        .select('customer_email')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()) as { data: { customer_email: string | null } | null };

      if (orderData?.customer_email) {
        userEmail = orderData.customer_email;
      } else {
        return NextResponse.json(
          { error: 'Kullanıcının e-posta adresi bulunamadı.' },
          { status: 404 }
        );
      }
    }

    // Kullanıcı adını çek (order'dan - loop dışında bir kez)
    const { data: orderData } = (await supabase
      .from('orders')
      .select('customer_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()) as { data: { customer_name: string | null } | null };

    if (orderData?.customer_name) {
      customerName = orderData.customer_name;
    }

    // Her cart item için product ve variant bilgilerini çek
    const cartItemsWithDetails: CartItemDisplay[] = [];
    let totalValue = 0;

    for (const item of cartItems) {
      // Ürün bilgilerini çek
      const { data: product } = (await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single()) as { data: Product | null };

      if (!product) continue;

      let variant: ProductVariant | null = null;
      if (item.variant_id) {
        const { data: variantData } = (await supabase
          .from('product_variants')
          .select('*')
          .eq('id', item.variant_id)
          .single()) as { data: ProductVariant | null };
        variant = variantData;
      }

      // Fiyat hesapla
      const basePrice = product.is_discount_active ? product.discount_price || product.price : product.price;
      const itemPrice = variant ? basePrice + variant.additional_price : basePrice;
      totalValue += itemPrice * item.quantity;

      cartItemsWithDetails.push({
        product,
        variant,
        quantity: item.quantity,
      });
    }

    // HTML şablonunu oluştur
    const emailHtml = AbandonedCartEmailTemplate({
      customerName,
      customerEmail: userEmail!,
      items: cartItemsWithDetails,
      totalValue,
    });

    // Resend'e gönder
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Sandbox test adresi
      to: 'tahaglbz1@gmail.com', // Sandbox - sadece hesabı açan maile
      subject: '🛒 Sepetinizde Ürün Unuttunuz! Tamamlamak İçin Geri Dönün',
      html: emailHtml,
    });

    // Response kontrolü
    if (error || !data?.id) {
      throw new Error(error?.message || 'Email API hatası: Yanıt ID bulunamadı');
    }

    // Veritabanında cart items'ın abandonment_mail_sent bayrağını TRUE'ya set et
    // (eğer bu kolonu cart_items'da varsa)
    try {
      await supabase
        .from('cart_items')
        .update({ abandonment_mail_sent: true })
        .eq('user_id', userId);
    } catch (dbError) {
      // Kolonu yoksa, bu hata yok sayılabilir
      console.warn('abandonment_mail_sent güncelleme hatası:', dbError);
    }

    // Başarılı yanıt
    return NextResponse.json(
      {
        success: true,
        message: 'Sepet hatırlatma maili başarıyla gönderildi!',
        messageId: data.id,
        itemCount: cartItemsWithDetails.length,
        totalValue,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remind Cart API Error:', error);

    return NextResponse.json(
      {
        error: 'Sepet hatırlatma maili gönderme sırasında bir hata oluştu.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
