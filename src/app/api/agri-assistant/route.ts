import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Tu es AgriAssistant, un expert agricole spécialisé en Afrique de l'Ouest (Sénégal, Gambie, Guinée).
Tu aides les agriculteurs, producteurs, transporteurs et acheteurs avec :
- Diagnostic de maladies des plantes à partir de photos
- Conseils techniques agricoles adaptés au climat local
- Informations sur les cultures locales : mil, maïs, arachide, tomate, oignon, manioc, mangue, etc.
- Conseils sur les engrais naturels et traitements locaux
- Gestion des parasites et maladies
- Conseils de stockage et conservation des récoltes
- Météo et saisons agricoles en Afrique de l'Ouest
Réponds toujours en français simple et pratique. Maximum 5 points clairs.
Si on t'envoie une photo de plante, donne un diagnostic précis avec des solutions concrètes et accessibles localement.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages invalides' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content.find(b => b.type === 'text')?.text
      ?? "Désolé, je n'ai pas pu répondre. Réessayez."

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('AgriAssistant error:', error)
    return NextResponse.json(
      { error: "Une erreur s'est produite. Réessayez." },
      { status: 500 }
    )
  }
}
