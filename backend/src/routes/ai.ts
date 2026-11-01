import { Router } from 'express'
import { detectProduct } from '../controllers/aiController'
import { aiRateLimit } from '../middleware/rateLimit'

const router = Router()
router.post('/detect', aiRateLimit, detectProduct)

export default router
