# 🚀 Swagger Express Automate

The most **flexible** Swagger API documentation package for Express.js. Use it in 4 different ways!

## ⚡ Installation

```bash
npm install swagger-express-automate
```

## 🎯 Key Features

✅ **4 different usage methods** - choose what fits you best  
✅ **Router auto-scan** - automatic documentation with `app.use()`  
✅ **Decorator pattern** - add metadata separately  
✅ **Manual API** - full control for those who need it  
✅ **Group support** - create route groups  
✅ **Middleware friendly** - works with any middleware  

---

## 📖 Usage Methods

### 🔹 Method 1: Router Scan (Simplest)

Create your routers and just scan them:

```javascript
const express = require('express');
const SwaggerAutomate = require('swagger-express-automate');

const app = express();
const swagger = new SwaggerAutomate(app, {
  title: 'My API',
  version: '1.0.0'
});

const userRouter = express.Router();
userRouter.get('/', (req, res) => res.json([{ id: 1, name: 'John' }]));
userRouter.post('/', (req, res) => res.json(req.body));
userRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));

app.use('/api/users', swagger.middleware(userRouter), userRouter);

swagger.setupSwaggerUI('/docs');
```

**✨ Automatic:**
- All routes are scanned
- Path parameters auto-detected
- Default documentation generated

---

### 🔹 Method 2: Scan + Metadata

Scan routes first, then add metadata:

```javascript
app.use('/api/users', swagger.middleware(userRouter), userRouter);

swagger
  .doc('GET', '/api/users', {
    summary: 'Get all users',
    tags: ['Users'],
    responses: {
      200: {
        description: 'User list',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: swagger.createSchema({
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' }
              })
            }
          }
        }
      }
    }
  })
  .doc('POST', '/api/users', {
    summary: 'Create new user',
    tags: ['Users'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(
      swagger.createSchema({
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' }
      }, ['name', 'email'])
    )
  });
```

**✨ Benefits:**
- Routes and documentation are separated
- Add metadata without changing existing code
- Cleaner and more modular

---

### 🔹 Method 3: Manual API

Routes and documentation together:

```javascript
swagger.post('/api/products', (req, res) => {
  res.status(201).json(req.body);
}, {
  summary: 'Create new product',
  tags: ['Products'],
  security: [{ BearerAuth: [] }],
  requestBody: swagger.createRequestBody(
    swagger.createSchema({
      name: { type: 'string', example: 'Laptop' },
      price: { type: 'number', example: 1500 },
      category: { type: 'string', example: 'Electronics' }
    }, ['name', 'price'])
  ),
  responses: {
    ...swagger.createResponse(201, 'Product created'),
    ...swagger.createResponse(400, 'Invalid data')
  }
});

swagger.get('/api/products/:id', handler, config);
swagger.put('/api/products/:id', handler, config);
swagger.delete('/api/products/:id', handler, config);
```

**✨ Ideal for:**
- Small APIs
- Quick prototypes
- When documentation and code should be together

---

### 🔹 Method 4: Group Pattern

Create route groups:

```javascript
swagger.group('/api/auth', (api) => {
  api.post('/login', (req, res) => {
    res.json({ token: 'jwt_token_here' });
  }, {
    summary: 'User login',
    tags: ['Auth'],
    requestBody: api.createRequestBody(
      api.createSchema({
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' }
      }, ['email', 'password'])
    )
  });

  api.post('/register', registerHandler, config);
  api.post('/logout', logoutHandler, config);
  api.post('/refresh', refreshHandler, config);
});
```

**✨ Benefits:**
- Organized code
- No prefix repetition
- Common configuration for the same group

---

## 🛠️ Helper Methods

### Create Schema

```javascript
const userSchema = swagger.createSchema({
  id: { type: 'integer', example: 1 },
  name: { type: 'string', example: 'John' },
  email: { type: 'string', format: 'email', example: 'john@example.com' },
  age: { type: 'integer', minimum: 0, example: 25 }
}, ['name', 'email']); // required fields
```

### Create Parameter

```javascript
swagger.createParameter(
  'id',           // name
  'path',         // location: 'path', 'query', 'header', 'cookie'
  'integer',      // type
  true,           // required
  'User ID'       // description
)
```

### Create Request Body

```javascript
swagger.createRequestBody(
  schema,
  'Request body description',
  true // required
)
```

### Create Response

```javascript
swagger.createResponse(
  200,
  'Successful operation',
  responseSchema
)
```

---

## 🔐 Authentication

Configure JWT and other authentication types:

```javascript
const swagger = new SwaggerAutomate(app, {
  title: 'Secure API',
  securityDefinitions: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    },
    OAuth2: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read': 'Read access',
            'write': 'Write access'
          }
        }
      }
    }
  }
});

swagger.get('/api/protected', handler, {
  summary: 'Protected endpoint',
  security: [{ BearerAuth: [] }]
});
```

---

## 🏷️ Tags and Groups

```javascript
const swagger = new SwaggerAutomate(app, {
  title: 'E-Commerce API',
  tags: [
    {
      name: 'Users',
      description: 'User operations'
    },
    {
      name: 'Products',
      description: 'Product operations',
      externalDocs: {
        description: 'Learn more',
        url: 'https://docs.example.com/products'
      }
    },
    {
      name: 'Orders',
      description: 'Order operations'
    }
  ]
});
```

---

## 🌐 Multi-Server Support

```javascript
const swagger = new SwaggerAutomate(app, {
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server'
    },
    {
      url: 'https://staging.example.com/v1',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    }
  ]
});
```

---

## 📦 Complete Example

```javascript
const express = require('express');
const SwaggerAutomate = require('swagger-express-automate');

const app = express();
app.use(express.json());

const swagger = new SwaggerAutomate(app, {
  title: 'E-Commerce API',
  version: '2.0.0',
  description: 'Fully functional e-commerce API',
  host: 'localhost:3000',
  basePath: '/api',
  tags: [
    { name: 'Products', description: 'Product operations' },
    { name: 'Users', description: 'User operations' }
  ],
  securityDefinitions: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
});

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

app.use('/api/products', swagger.middleware(productRouter), productRouter);

const productSchema = swagger.createSchema({
  id: { type: 'integer', example: 1 },
  name: { type: 'string', example: 'Gaming Laptop' },
  price: { type: 'number', format: 'float', example: 2499.99 },
  category: { type: 'string', example: 'Electronics' }
}, ['name', 'price']);

swagger
  .doc('GET', '/api/products', {
    summary: 'Get all products',
    tags: ['Products'],
    parameters: [
      swagger.createParameter('category', 'query', 'string', false, 'Category filter'),
      swagger.createParameter('minPrice', 'query', 'number', false, 'Minimum price')
    ]
  })
  .doc('POST', '/api/products', {
    summary: 'Create new product',
    tags: ['Products'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(productSchema),
    responses: {
      ...swagger.createResponse(201, 'Product created', productSchema),
      ...swagger.createResponse(400, 'Invalid data'),
      ...swagger.createResponse(401, 'Authentication required')
    }
  });

swagger.setupSwaggerUI('/docs');

app.listen(3000, () => {
  console.log('🚀 Server: http://localhost:3000');
  console.log('📖 Docs: http://localhost:3000/docs');
});
```

---

## 🎨 Decision Guide

| Method | Ideal For | Advantages |
|------|----------|-----------|
| **Router Scan** | Large projects, existing codebase | Fast, minimal changes |
| **Scan + Metadata** | Medium/large projects | Flexible, clean code |
| **Manual API** | Small projects, prototypes | Simple, everything together |
| **Group Pattern** | API versioning, modular code | Organized, readable |

---

## 📝 License

MIT

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

**Built with ❤️ for Express.js and Swagger users**