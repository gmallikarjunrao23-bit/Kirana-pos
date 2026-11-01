import { Router } from 'express'
import {
  lookupBarcode, createProduct, updateProduct,
  deleteProduct, searchProducts, getAllProducts,
} from '../controllers/productController'
import { productRateLimit } from '../middleware/rateLimit'

const router = Router()

router.use(productRateLimit)
router.get('/', getAllProducts)
router.get('/search', searchProducts)
router.get('/barcode/:barcode', lookupBarcode)
router.post('/', createProduct)
router.patch('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
