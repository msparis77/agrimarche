import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()
  const correct = process.env.ADMIN_PIN

  if (!correct) {
    return NextResponse.json({ error: 'PIN non configuré' }, { status: 500 })
  }

  if (pin !== correct) {
    // Délai intentionnel pour ralentir les attaques par force brute
    await new Promise(r => setTimeout(r, 800))
    return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
