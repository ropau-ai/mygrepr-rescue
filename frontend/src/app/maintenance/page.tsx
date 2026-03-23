'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Github, Mail } from 'lucide-react'

const CHARS = ['0', '1']

function BinaryRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<{ x: number; y: number; speed: number; size: number; opacity: number; baseOpacity: number; opacityDir: number; char: string }[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      const colWidth = 28
      const cols = Math.floor(canvas.width / colWidth)
      particlesRef.current = Array.from({ length: cols }, (_, i) => ({
        x: i * colWidth + colWidth / 2 + (Math.random() * 6 - 3),
        y: Math.random() * canvas.height,
        speed: 0.4 + Math.random() * 0.2,
        size: 12,
        baseOpacity: 0.08 + Math.random() * 0.1,
        opacity: 0.08 + Math.random() * 0.1,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        char: CHARS[Math.floor(Math.random() * CHARS.length)]
      }))
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current.forEach((p) => {
        ctx.font = `${p.size}px monospace`
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`
        ctx.fillText(p.char, p.x, p.y)

        p.y += p.speed
        p.opacity += p.opacityDir * 0.001
        if (p.opacity > p.baseOpacity + 0.06) p.opacityDir = -1
        if (p.opacity < p.baseOpacity - 0.02) p.opacityDir = 1

        if (p.y > canvas.height + 20) {
          p.y = -20
          p.char = CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [started, setStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i))
        i++
      } else {
        clearInterval(interval)
        setIsComplete(true)
      }
    }, 70)
    return () => clearInterval(interval)
  }, [started, text])

  return (
    <span>
      {displayText}
      {started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: isComplete ? 0.8 : 0.4, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] ml-1 align-middle bg-green-500"
        />
      )}
    </span>
  )
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0A0A0A] text-gray-100">
      <BinaryRain />

      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-8">
        <div>
          <h2 className="text-lg font-bold tracking-[0.04em]">
            GREPR
          </h2>
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 font-light mt-0.5">
            Reddit Finance Dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/Jelil-ah/mygrepr" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-300 transition-colors" aria-label="GitHub">
            <Github size={16} />
          </a>
          <span className="w-2 h-2 rounded-full animate-pulse bg-green-500" />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 font-light mb-6">
              System Status
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.04em] leading-tight mb-2">
              Grepr is currently
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.04em] leading-tight text-green-500">
              <TypewriterText text="under maintenance" delay={500} />
            </h1>
            <p className="text-sm text-gray-500 font-light mt-6">
              Upgrading systems. We&apos;ll be back shortly.
            </p>
            <motion.a
              href="mailto:contact@jelilahounou.com"
              className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-gray-400 hover:text-green-500 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <Mail size={14} />
              Contact me
            </motion.a>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 px-6 sm:px-10 lg:px-16 py-6">
        <p className="text-[10px] tracking-[0.1em] text-gray-600 font-light">
          &copy; 2026 Grepr
        </p>
      </footer>
    </div>
  )
}
