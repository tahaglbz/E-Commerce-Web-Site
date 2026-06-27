import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('get_financial_and_stock_metrics')

    if (error) {
      console.error('[Accounting RPC Error]', error)
      return NextResponse.json(
        { error: 'Finansal metrikler alınamadı.', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    console.error('[Accounting API Error]', err)
    return NextResponse.json(
      {
        error: 'Sunucu hatası oluştu.',
        details: err instanceof Error ? err.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    )
  }
}
