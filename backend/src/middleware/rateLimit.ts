import rateLimit from 'express-rate-limit'
import { Request } from 'express'

function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  message: { message: 'Too many requests. Slow down.' },
})

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  message: { message: 'AI detection rate limit. Wait a moment.' },
})

export const productRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  message: { message: 'Too many product requests.' },
})
