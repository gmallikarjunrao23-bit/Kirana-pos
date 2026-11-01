import { Router } from 'express'
import { getStats } from '../controllers/billController'

const router = Router()
router.get('/', getStats)

export default router
