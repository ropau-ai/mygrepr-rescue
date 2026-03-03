'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface Particle {
  x: number
  y: number
  speed: number
  size: number
  opacity: number
  char: string
}

const CHARS = ['0', '1', '·', '•', '○', '□']

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme || theme) === 'dark'
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles - low count for performance
    const particleCount = Math.min(
      Math.floor((window.innerWidth * window.innerHeight) / 40000),
      30
    )
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.2 + Math.random() * 0.3,
      size: 10 + Math.random() * 6,
      opacity: 0.1 + Math.random() * 0.15,
      char: CHARS[Math.floor(Math.random() * CHARS.length)]
    }))

    // Throttled animation loop (~20fps)
    let lastTime = 0
    const frameInterval = 50 // 20fps
    const baseColor = isDark ? '139, 92, 246' : '109, 40, 217'

    const animate = (timestamp: number) => {
      if (timestamp - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTime = timestamp

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle) => {
        ctx.font = `${particle.size}px monospace`
        ctx.fillStyle = `rgba(${baseColor}, ${particle.opacity})`
        ctx.fillText(particle.char, particle.x, particle.y)

        particle.y += particle.speed

        if (particle.y > canvas.height + 20) {
          particle.y = -20
          particle.x = Math.random() * canvas.width
          particle.char = CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
      aria-hidden="true"
    />
  )
}
