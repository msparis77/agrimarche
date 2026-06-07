'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface Props {
  onResult: (text: string) => void
  size?: number
  className?: string
}

export default function MicButton({ onResult, size = 18, className = '' }: Props) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const toggle = () => {
    if (listening) {
      recRef.current?.stop()
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Reconnaissance vocale non disponible sur ce navigateur. Utilisez Chrome ou Safari.')
      return
    }

    const rec = new SR()
    rec.lang = 'fr-FR'
    rec.continuous = false
    rec.interimResults = false
    recRef.current = rec

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: any) => {
      const text: string = e.results[0][0].transcript
      onResult(text)
    }

    rec.start()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Arrêter l'écoute" : 'Dicter'}
      className={`flex-shrink-0 flex items-center justify-center transition active:scale-95 ${
        listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#166534]'
      } ${className}`}
    >
      {listening ? <MicOff size={size} /> : <Mic size={size} />}
    </button>
  )
}
