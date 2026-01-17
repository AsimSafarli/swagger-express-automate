import  express  from 'express'
import SwaggerAutomate from '../index.js'

const app = express();
app.use(express.json());

// ==========================================
// Advanced Pattern: Middleware Stack
// ==========================================

const swagger = new SwaggerAutomate(app, {
  title: 'Advanced API Patterns',
  version: '1.0.0',
  host: 'localhost:3000',
  securityDefinitions: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
});

// ==========================================
// Authentication Middleware
// ==========================================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token tələb olunur' });
  }
  req.user = { id: 1, role: 'admin' };
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'İcazə yoxdur' });
    }
    next();
  };
};

// ==========================================
// Pattern 1: Middleware chain ilə router
// ==========================================

const adminRouter = express.Router();

adminRouter.use(authenticate);
adminRouter.use(authorize('admin'));

adminRouter.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Ali', role: 'user' },
    { id: 2, name: 'Vəli', role: 'admin' }
  ]);
});

adminRouter.post('/users/:id/ban', (req, res) => {
  res.json({ message: 'İstifadəçi ban edildi', userId: req.params.id });
});

app.use('/api/admin', swagger.middleware('/api/admin', adminRouter), adminRouter);

swagger
  .doc('GET', '/api/admin/users', {
    summary: 'Bütün istifadəçiləri idarə et',
    description: 'Yalnız admin istifadəçilər üçün',
    tags: ['Admin'],
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'İstifadəçi siyahısı' },
      401: { description: 'Autentifikasiya tələb olunur' },
      403: { description: 'Admin icazəsi tələb olunur' }
    }
  })
  .doc('POST', '/api/admin/users/:id/ban', {
    summary: 'İstifadəçini ban et',
    tags: ['Admin'],
    security: [{ BearerAuth: [] }],
    parameters: [
      swagger.createParameter('id', 'path', 'integer', true, 'İstifadəçi ID-si')
    ],
    requestBody: swagger.createRequestBody(
      swagger.createSchema({
        reason: { type: 'string', example: 'Spam' },
        duration: { type: 'string', enum: ['1day', '1week', 'permanent'], example: '1week' }
      }, ['reason'])
    )
  });

// ==========================================
// Pattern 2: Validation middleware
// ==========================================

const validate = (schema) => {
  return (req, res, next) => {
    // Validation logic
    const errors = [];
    if (schema.name && !req.body.name) {
      errors.push('name tələb olunur');
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    next();
  };
};

const productRouter = express.Router();

const productValidation = {
  name: { required: true, type: 'string' },
  price: { required: true, type: 'number', min: 0 }
};

productRouter.post('/', validate(productValidation), (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

app.use('/api/products', swagger.middleware(productRouter), productRouter);

swagger.doc('POST', '/api/products', {
  summary: 'Məhsul yarat (validation ilə)',
  tags: ['Products'],
  requestBody: swagger.createRequestBody(
    swagger.createSchema({
      name: { type: 'string', example: 'Laptop', minLength: 3 },
      price: { type: 'number', example: 1500, minimum: 0 },
      description: { type: 'string', example: 'Güclü laptop' }
    }, ['name', 'price'])
  ),
  responses: {
    ...swagger.createResponse(201, 'Məhsul yaradıldı'),
    ...swagger.createResponse(400, 'Validation xətası')
  }
});

// ==========================================
// Pattern 3: Rate limiting
// ==========================================

const rateLimit = (max, window) => {
  const requests = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = requests.get(key) || { count: 0, resetTime: now + window };
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + window;
    }
    
    record.count++;
    requests.set(key, record);
    
    if (record.count > max) {
      return res.status(429).json({ error: 'Çox sorğu göndərildi' });
    }
    
    next();
  };
};

const publicRouter = express.Router();
publicRouter.use(rateLimit(10, 60000)); // 10 requests per minute

publicRouter.get('/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/public', swagger.middleware(publicRouter), publicRouter);

swagger.doc('GET', '/api/public/status', {
  summary: 'API statusu',
  description: 'Dəqiqədə 10 sorğu limiti',
  tags: ['Public'],
  responses: {
    200: { description: 'Status məlumatı' },
    429: { description: 'Rate limit aşıldı' }
  }
});

// ==========================================
// Pattern 4: Pagination middleware
// ==========================================

const paginate = (req, res, next) => {
  req.pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    offset: ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 10)
  };
  next();
};

const itemsRouter = express.Router();

itemsRouter.get('/', paginate, (req, res) => {
  const { page, limit, offset } = req.pagination;
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
  const paginatedItems = items.slice(offset, offset + limit);
  
  res.json({
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit)
    }
  });
});

app.use('/api/items', swagger.middleware(itemsRouter), itemsRouter);

swagger.doc('GET', '/api/items', {
  summary: 'Səhifələnmiş məlumat',
  tags: ['Items'],
  parameters: [
    swagger.createParameter('page', 'query', 'integer', false, 'Səhifə nömrəsi (default: 1)'),
    swagger.createParameter('limit', 'query', 'integer', false, 'Səhifə başına say (default: 10)')
  ],
  responses: {
    200: {
      description: 'Səhifələnmiş nəticələr',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: swagger.createSchema({
                  id: { type: 'integer' },
                  name: { type: 'string' }
                })
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  pages: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  }
});

// ==========================================
// Pattern 5: Caching middleware
// ==========================================

const cache = new Map();

const cacheMiddleware = (duration = 60000) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return res.json(cached.data);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, {
        data: data,
        expiry: Date.now() + duration
      });
      originalJson(data);
    };
    
    next();
  };
};

const cachedRouter = express.Router();

cachedRouter.get('/news', cacheMiddleware(30000), (req, res) => {
  // Expensive database query
  res.json([
    { id: 1, title: 'Xəbər 1', date: new Date() },
    { id: 2, title: 'Xəbər 2', date: new Date() }
  ]);
});

app.use('/api', swagger.middleware(cachedRouter), cachedRouter);

swagger.doc('GET', '/api/news', {
  summary: 'Xəbərlər (30 saniyə cache)',
  tags: ['News'],
  responses: {
    200: { description: 'Xəbər siyahısı' }
  }
});

// ==========================================
// Pattern 6: File upload
// ==========================================

const uploadRouter = express.Router();

uploadRouter.post('/avatar', (req, res) => {
  res.json({ message: 'Avatar yükləndi', url: '/uploads/avatar.jpg' });
});

app.use('/api/upload', swagger.middleware(uploadRouter), uploadRouter);

swagger.doc('POST', '/api/upload/avatar', {
  summary: 'Avatar şəkli yüklə',
  tags: ['Upload'],
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            avatar: {
              type: 'string',
              format: 'binary',
              description: 'Avatar şəkli (JPG, PNG, max 5MB)'
            }
          }
        }
      }
    }
  },
  responses: {
    200: { description: 'Fayl yükləndi' },
    400: { description: 'Yanlış fayl formatı' }
  }
});

// ==========================================
// Swagger UI
// ==========================================

swagger.setupSwaggerUI('/docs');

// ==========================================
// Server
// ==========================================

const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n🚀 Advanced Patterns Server işləyir!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📖 Docs: http://localhost:${PORT}/docs`);
  console.log('\n📚 Pattern-lər:');
  console.log('  ✓ Authentication & Authorization');
  console.log('  ✓ Validation Middleware');
  console.log('  ✓ Rate Limiting');
  console.log('  ✓ Pagination');
  console.log('  ✓ Caching');
  console.log('  ✓ File Upload');
  console.log('');
});