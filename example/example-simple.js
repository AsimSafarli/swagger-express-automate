import  express  from 'express'
import SwaggerAutomate from '../index.js'

const app = express();
app.use(express.json());

// Swagger instance
const swagger = new SwaggerAutomate(app, {
  title: 'Sadə API',
  version: '1.0.0',
  host: 'localhost:3000'
});

// ==========================================
// ÜSİL 1: Ən sadə - router scan
// ==========================================

const userRouter = express.Router();

userRouter.get('/', (req, res) => res.json([{ id: 1, name: 'Ali' }]));
userRouter.post('/', (req, res) => res.json(req.body));
userRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));

// Router-i scan et və istifadə et
app.use('/users', swagger.middleware(userRouter), userRouter);

// ==========================================
// ÜSİL 2: Metadata əlavə et
// ==========================================

swagger
  .doc('GET', '/users', {
    summary: 'İstifadəçiləri gətir',
    tags: ['Users']
  })
  .doc('POST', '/users', {
    summary: 'İstifadəçi yarat',
    tags: ['Users'],
    requestBody: swagger.createRequestBody(
      swagger.createSchema({
        name: { type: 'string' },
        email: { type: 'string' }
      })
    )
  });

// ==========================================
// ÜSİL 3: Birbaşa route + doc
// ==========================================

swagger.get('/products', (req, res) => {
  res.json([{ id: 1, name: 'Laptop' }]);
}, {
  summary: 'Məhsullar',
  tags: ['Products']
});

// Swagger UI
swagger.setupSwaggerUI('/docs');

app.listen(3000, () => {
  console.log('🚀 Server: http://localhost:3000');
  console.log('📖 Docs: http://localhost:3000/docs');
});