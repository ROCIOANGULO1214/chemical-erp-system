const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype === 'application/pdf' 
      ? 'uploads/products/drawings' 
      : 'uploads/products/images';
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar imágenes y PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpg, png, gif) y PDF'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Importar controlador
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadDrawingPdf,
  getQualityTestTemplates,
  getProductsKPIs
} = require('../controllers/productsController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Productos CRUD
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorizeRole(['admin', 'supervisor', 'quality']), createProduct);
router.put('/:id', authorizeRole(['admin', 'supervisor', 'quality']), updateProduct);
router.delete('/:id', authorizeRole(['admin', 'supervisor']), deleteProduct);

// Subida de archivos
router.post('/upload-image', upload.single('part_image'), uploadProductImage);
router.post('/upload-drawing', upload.single('drawing_pdf'), uploadDrawingPdf);

// Templates y KPIs
router.get('/quality-tests/templates', getQualityTestTemplates);
router.get('/kpis', getProductsKPIs);

module.exports = router;
