import { Router } from 'express'
import { createBill, getBills } from '../controllers/billController'

const router = Router()
router.post('/', createBill)
router.get('/', getBills)

export default router
