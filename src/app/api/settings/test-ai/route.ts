import { NextRequest, NextResponse } from 'next/server';
import { testAiConnection, AiSettings } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body: AiSettings = await req.json();
    const result = await testAiConnection(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}
