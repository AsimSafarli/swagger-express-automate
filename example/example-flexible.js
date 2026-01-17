import  express from 'express'
import SwaggerAutomate from '../index.js'

const app = express();
app.use(express.json());

// ==========================================
// ÜSUL 1: Router scan (app.use ilə)
// ==========================================

const userRouter = express.Router();

// Sadə route-lar
userRouter.get('/', (req, res) => {
  res.json([{ id: 1, name: 'Ali' }]);
});

userRouter.get('/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Ali' });
});

userRouter.post('/', (req, res) => {
  res.status(201).json(req.body);
});

userRouter.put('/:id', (req, res) => {
  res.json({ ...req.body, id: req.params.id });
});

userRouter.delete('/:id', (req, res) => {
  res.status(204).send();
});

// ==========================================
// ÜSUL 2: Məhsul router + metadata
// ==========================================

const productRouter = express.Router();

productRouter.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'Laptop', price: 1500 },
    { id: 2, name: 'Phone', price: 800 }
  ]);
});

productRouter.post('/', (req, res) => {
  res.status(201).json(req.body);
});

productRouter.get('/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Laptop', price: 1500 });
});

// ==========================================
// Swagger quraşdırma
// ==========================================

const swagger = new SwaggerAutomate(app, {
  title: 'E-Commerce API',
  version: '1.0.0',
  description: 'Flexible Swagger Documentation',
  host: 'localhost:3000',
  basePath: '/api',
  tags: [
    { name: 'Users', description: 'İstifadəçi əməliyyatları' },
    { name: 'Products', description: 'Məhsul əməliyyatları' },
    { name: 'Orders', description: 'Sifariş əməliyyatları' }
  ],
  securityDefinitions: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
});

// ==========================================
// Routerləri qeyd et və scan et
// ==========================================

// 1. Sadə scan - heç bir metadata olmadan
app.use('/api/users', swagger.middleware(userRouter), userRouter);

// 2. Metadata əlavə et (router scan-dan SONRA)
swagger
  .doc('GET', '/api/users', {
    summary: 'Bütün istifadəçiləri əldə et',
    tags: ['Users'],
    responses: {
      200: {
        description: 'İstifadəçi siyahısı',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: swagger.createSchema({
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Ali Məmmədov' },
                email: { type: 'string', example: 'ali@example.com' }
              })
            }
          }
        }
      }
    }
  })
  .doc('POST', '/api/users', {
    summary: 'Yeni istifadəçi yarat',
    tags: ['Users'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(
      swagger.createSchema({
        name: { type: 'string', example: 'Vəli Həsənov' },
        email: { type: 'string', format: 'email', example: 'veli@example.com' },
        password: { type: 'string', format: 'password', example: 'secret123' }
      }, ['name', 'email', 'password']),
      'İstifadəçi məlumatları'
    ),
    responses: {
      201: { description: 'İstifadəçi yaradıldı' },
      400: { description: 'Yanlış məlumat' },
      401: { description: 'Autentifikasiya tələb olunur' }
    }
  })
  .doc('GET', '/api/users/:id', {
    summary: 'ID-yə görə istifadəçi',
    tags: ['Users'],
    parameters: [
      swagger.createParameter('id', 'path', 'integer', true, 'İstifadəçi ID-si')
    ]
  });

// 3. Məhsul router - detallı metadata
app.use('/api/products', swagger.middleware('/api/products', productRouter), productRouter);

const productSchema = swagger.createSchema({
  id: { type: 'integer', example: 1 },
  name: { type: 'string', example: 'Gaming Laptop' },
  description: { type: 'string', example: 'Güclü gaming laptop' },
  price: { type: 'number', format: 'float', example: 2499.99 },
  category: { type: 'string', example: 'Electronics' },
  inStock: { type: 'boolean', example: true },
  imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/laptop.jpg' }
}, ['name', 'price']);

swagger
  .doc('GET', '/api/products', {
    summary: 'Bütün məhsulları əldə et',
    description: 'Mağazadakı bütün məhsulların siyahısını qaytarır. Filtrlə və səhifələmə dəstəyi var.',
    tags: ['Products'],
    parameters: [
      swagger.createParameter('category', 'query', 'string', false, 'Kateqoriyaya görə filtr'),
      swagger.createParameter('minPrice', 'query', 'number', false, 'Minimum qiymət'),
      swagger.createParameter('maxPrice', 'query', 'number', false, 'Maksimum qiymət'),
      swagger.createParameter('page', 'query', 'integer', false, 'Səhifə nömrəsi'),
      swagger.createParameter('limit', 'query', 'integer', false, 'Səhifə başına məhsul sayı')
    ],
    responses: {
      200: {
        description: 'Məhsul siyahısı',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: productSchema
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  .doc('POST', '/api/products', {
    summary: 'Yeni məhsul əlavə et',
    tags: ['Products'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(productSchema, 'Məhsul məlumatları'),
    responses: {
      ...swagger.createResponse(201, 'Məhsul yaradıldı', productSchema),
      ...swagger.createResponse(400, 'Yanlış məlumat'),
      ...swagger.createResponse(401, 'Autentifikasiya tələb olunur')
    }
  })
  .doc('GET', '/api/products/:id', {
    summary: 'ID-yə görə məhsul',
    tags: ['Products'],
    responses: {
      ...swagger.createResponse(200, 'Məhsul tapıldı', productSchema),
      ...swagger.createResponse(404, 'Məhsul tapılmadı')
    }
  });

// ==========================================
// ÜSUL 3: Manual route əlavə etmə (köhnə stil)
// ==========================================

swagger.post('/api/orders', (req, res) => {
  res.status(201).json({ 
    id: 1, 
    userId: req.body.userId, 
    items: req.body.items,
    total: 2499.99,
    status: 'pending'
  });
}, {
  summary: 'Yeni sifariş yarat',
  tags: ['Orders'],
  security: [{ BearerAuth: [] }],
  requestBody: swagger.createRequestBody(
    swagger.createSchema({
      userId: { type: 'integer', example: 1 },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'integer' },
            quantity: { type: 'integer' }
          }
        },
        example: [
          { productId: 1, quantity: 2 },
          { productId: 3, quantity: 1 }
        ]
      },
      shippingAddress: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string' }
        }
      }
    }, ['userId', 'items', 'shippingAddress']),
    'Sifariş məlumatları'
  )
});

swagger.get('/api/orders/:id', (req, res) => {
  res.json({
    id: req.params.id,
    userId: 1,
    items: [],
    total: 2499.99,
    status: 'pending'
  });
}, {
  summary: 'Sifarişi əldə et',
  tags: ['Orders'],
  security: [{ BearerAuth: [] }]
});

// ==========================================
// ÜSUL 4: Group pattern
// ==========================================

swagger.group('/api/auth', (api) => {
  api.post('/login', (req, res) => {
    res.json({ token: 'jwt_token_here', expiresIn: 3600 });
  }, {
    summary: 'İstifadəçi girişi',
    tags: ['Auth'],
    requestBody: api.createRequestBody(
      api.createSchema({
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', format: 'password', example: 'password123' }
      }, ['email', 'password'])
    ),
    responses: {
      200: {
        description: 'Uğurlu giriş',
        content: {
          'application/json': {
            schema: api.createSchema({
              token: { type: 'string' },
              expiresIn: { type: 'integer' },
              refreshToken: { type: 'string' }
            })
          }
        }
      },
      401: { description: 'Yanlış email və ya şifrə' }
    }
  });

  api.post('/register', (req, res) => {
    res.status(201).json({ message: 'Qeydiyyat uğurlu oldu' });
  }, {
    summary: 'Qeydiyyatdan keç',
    tags: ['Auth']
  });

  api.post('/refresh', (req, res) => {
    res.json({ token: 'new_jwt_token' });
  }, {
    summary: 'Token-i yenilə',
    tags: ['Auth'],
    security: [{ BearerAuth: [] }]
  });
});

// ==========================================
// Root və health check
// ==========================================

app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce API',
    version: '1.0.0',
    documentation: '/docs'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
  console.log('\n🚀 Server işləyir!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/docs`);
  console.log(`📄 Swagger JSON: http://localhost:${PORT}/docs.json`);
  console.log('\n📚 Mövcud endpoint-lər:');
  console.log('  • GET    /api/users');
  console.log('  • POST   /api/users');
  console.log('  • GET    /api/users/:id');
  console.log('  • GET    /api/products');
  console.log('  • POST   /api/products');
  console.log('  • GET    /api/products/:id');
  console.log('  • POST   /api/orders');
  console.log('  • GET    /api/orders/:id');
  console.log('  • POST   /api/auth/login');
  console.log('  • POST   /api/auth/register');
  console.log('  • POST   /api/auth/refresh');
  console.log('');
});

// ==========================================
// Export (modul kimi istifadə üçün)
// ==========================================

export default app;