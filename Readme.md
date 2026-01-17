# 🚀 Swagger Express Automate - Flexible Edition

Express.js üçün **ən flexible** Swagger API sənədləşdirmə paketi. 4 fərqli üsulla istifadə edə bilərsiniz!

## ⚡ Quraşdırma

```bash
npm install swagger-express-automate
```

## 🎯 Əsas Xüsusiyyətlər

✅ **4 fərqli istifadə üsulu** - sizə uyğun olanı seçin  
✅ **Router auto-scan** - `app.use()` ilə avtomatik sənədləşdirmə  
✅ **Decorator pattern** - metadata ayrıca əlavə edin  
✅ **Manual API** - tam nəzarət istəyənlər üçün  
✅ **Group support** - route qrupları yaradın  
✅ **Middleware dəstəyi** - istənilən middleware əlavə edin  

---

## 📖 İstifadə Üsulları

### 🔹 Üsul 1: Router Scan (Ən Sadə)

Router-lərinizi yaradın və sadəcə scan edin:

```javascript
const express = require('express');
const SwaggerAutomate = require('swagger-express-automate');

const app = express();
const swagger = new SwaggerAutomate(app, {
  title: 'Mənim API-m',
  version: '1.0.0'
});

// Router yaradın
const userRouter = express.Router();
userRouter.get('/', (req, res) => res.json([{ id: 1, name: 'Ali' }]));
userRouter.post('/', (req, res) => res.json(req.body));
userRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));

// Scan edin və istifadə edin
app.use('/api/users', swagger.middleware(userRouter), userRouter);

swagger.setupSwaggerUI('/docs');
```

**✨ Avtomatik:**
- Bütün route-lar scan olunur
- Path parametrləri avtomatik tapılır
- Default sənədləşdirmə yaranır

---

### 🔹 Üsul 2: Scan + Metadata

Router scan edin, sonra metadata əlavə edin:

```javascript
// Router scan
app.use('/api/users', swagger.middleware(userRouter), userRouter);

// Metadata əlavə et
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
    summary: 'Yeni istifadəçi yarat',
    tags: ['Users'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(
      swagger.createSchema({
        name: { type: 'string', example: 'Ali Məmmədov' },
        email: { type: 'string', example: 'ali@example.com' }
      }, ['name', 'email'])
    )
  });
```

**✨ Üstünlükləri:**
- Route-lar və sənədləşdirmə ayrıdır
- Mövcud kodu dəyişmədən metadata əlavə edə bilərsiniz
- Daha təmiz və modular

---

### 🔹 Üsul 3: Manual API (Köhnə Stil)

Route və sənədləşdirmə eyni yerdə:

```javascript
swagger.post('/api/products', (req, res) => {
  res.status(201).json(req.body);
}, {
  summary: 'Yeni məhsul yarat',
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
    ...swagger.createResponse(201, 'Məhsul yaradıldı'),
    ...swagger.createResponse(400, 'Yanlış məlumat')
  }
});

swagger.get('/api/products/:id', handler, config);
swagger.put('/api/products/:id', handler, config);
swagger.delete('/api/products/:id', handler, config);
```

**✨ İdeal hallar:**
- Kiçik API-lər
- Sürətli prototipler
- Sənədləşdirmə və kod eyni yerdə olmalı

---

### 🔹 Üsul 4: Group Pattern

Route qrupları yaradın:

```javascript
swagger.group('/api/auth', (api) => {
  api.post('/login', (req, res) => {
    res.json({ token: 'jwt_token_here' });
  }, {
    summary: 'İstifadəçi girişi',
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

**✨ Üstünlükləri:**
- Təşkilatlanmış kod
- Prefix təkrarlanmır
- Eyni group üçün ortaq konfiqurasiya

---

## 🛠️ Helper Metodlar

### Schema yaradın

```javascript
const userSchema = swagger.createSchema({
  id: { type: 'integer', example: 1 },
  name: { type: 'string', example: 'Ali' },
  email: { type: 'string', format: 'email', example: 'ali@example.com' },
  age: { type: 'integer', minimum: 0, example: 25 }
}, ['name', 'email']); // required fields
```

### Parameter yaradın

```javascript
swagger.createParameter(
  'id',              // name
  'path',            // location: 'path', 'query', 'header', 'cookie'
  'integer',         // type
  true,              // required
  'İstifadəçi ID-si' // description
)
```

### Request Body

```javascript
swagger.createRequestBody(
  schema,
  'Request body təsviri',
  true // required
)
```

### Response

```javascript
swagger.createResponse(
  200,
  'Uğurlu əməliyyat',
  responseSchema
)
```

---

## 🔐 Authentication

JWT və digər autentifikasiya növlərini konfiqurasiya edin:

```javascript
const swagger = new SwaggerAutomate(app, {
  title: 'Secure API',
  securityDefinitions: {
    // Bearer JWT
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    // API Key
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    },
    // OAuth2
    OAuth2: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read': 'Oxu',
            'write': 'Yaz'
          }
        }
      }
    }
  }
});

// Route-da istifadə edin
swagger.get('/api/protected', handler, {
  summary: 'Qorunan endpoint',
  security: [{ BearerAuth: [] }]
});
```

---

## 🏷️ Tags və Qruplar

```javascript
const swagger = new SwaggerAutomate(app, {
  title: 'E-Commerce API',
  tags: [
    {
      name: 'Users',
      description: 'İstifadəçi əməliyyatları'
    },
    {
      name: 'Products',
      description: 'Məhsul əməliyyatları',
      externalDocs: {
        description: 'Ətraflı məlumat',
        url: 'https://docs.example.com/products'
      }
    },
    {
      name: 'Orders',
      description: 'Sifariş əməliyyatları'
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

## 📦 Tam Nümunə

```javascript
const express = require('express');
const SwaggerAutomate = require('swagger-express-automate');

const app = express();
app.use(express.json());

// Swagger konfiqurasiyası
const swagger = new SwaggerAutomate(app, {
  title: 'E-Commerce API',
  version: '2.0.0',
  description: 'Tam funksional e-ticarət API',
  host: 'localhost:3000',
  basePath: '/api',
  tags: [
    { name: 'Products', description: 'Məhsul əməliyyatları' },
    { name: 'Users', description: 'İstifadəçi əməliyyatları' }
  ],
  securityDefinitions: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
});

// Router yaradın
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

// Router-i scan və istifadə edin
app.use('/api/products', swagger.middleware(productRouter), productRouter);

// Metadata əlavə edin
const productSchema = swagger.createSchema({
  id: { type: 'integer', example: 1 },
  name: { type: 'string', example: 'Gaming Laptop' },
  price: { type: 'number', format: 'float', example: 2499.99 },
  category: { type: 'string', example: 'Electronics' }
}, ['name', 'price']);

swagger
  .doc('GET', '/api/products', {
    summary: 'Bütün məhsulları əldə et',
    tags: ['Products'],
    parameters: [
      swagger.createParameter('category', 'query', 'string', false, 'Kateqoriya filtri'),
      swagger.createParameter('minPrice', 'query', 'number', false, 'Minimum qiymət')
    ]
  })
  .doc('POST', '/api/products', {
    summary: 'Yeni məhsul yarat',
    tags: ['Products'],
    security: [{ BearerAuth: [] }],
    requestBody: swagger.createRequestBody(productSchema),
    responses: {
      ...swagger.createResponse(201, 'Məhsul yaradıldı', productSchema),
      ...swagger.createResponse(400, 'Yanlış məlumat'),
      ...swagger.createResponse(401, 'Autentifikasiya tələb olunur')
    }
  });

// Swagger UI
swagger.setupSwaggerUI('/docs');

app.listen(3000, () => {
  console.log('🚀 Server: http://localhost:3000');
  console.log('📖 Docs: http://localhost:3000/docs');
});
```

---

## 🎨 İstifadə Qərarı

| Üsul | İdeal Hallar | Üstünlüklər |
|------|-------------|------------|
| **Router Scan** | Böyük layihələr, mövcud kod bazası | Sürətli, minimal dəyişiklik |
| **Scan + Metadata** | Orta/böyük layihələr | Flexible, təmiz kod |
| **Manual API** | Kiçik layihələr, prototipler | Sadə, hamısı bir yerdə |
| **Group Pattern** | API versiyalaşdırma, modulyar kod | Təşkilatlanmış, oxunaqlı |

---

## 🚀 NPM-ə Yükləmək

```bash
# 1. npm hesabı yaradın
# https://www.npmjs.com/signup

# 2. Login olun
npm login

# 3. Publish edin
npm publish

# Scoped package üçün
npm publish --access public
```

---

## 📝 License

MIT

## 🤝 Töhfə

Pull request-lər qəbul edilir! Böyük dəyişikliklər üçün əvvəlcə issue açın.

---

# 🔄 İstifadə Üsulları Müqayisəsi

## 4 Fərqli Üsul

### 📊 Müqayisə Cədvəli

| Xüsusiyyət | Router Scan | Scan + Metadata | Manual API | Group Pattern |
|-----------|------------|----------------|-----------|---------------|
| **Sürət** | ⚡⚡⚡ | ⚡⚡ | ⚡ | ⚡⚡ |
| **Flexibility** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Kod təmizliyi** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Öyrənmə asanlığı** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Böyük layihə** | ✅ | ✅ | ❌ | ✅ |
| **Kiçik layihə** | ✅ | ⚠️ | ✅ | ⚠️ |
| **Mövcud koda uyğun** | ✅ | ✅ | ❌ | ⚠️ |

---

## 1️⃣ Router Scan

### ✅ İstifadə edin:
- Mövcud kod bazası var
- Sürətli inteqrasiya lazımdır
- Minimal dəyişiklik istəyirsiniz
- Böyük layihədə işləyirsiniz

### ❌ İstifadə etməyin:
- Çox detallı sənədləşdirmə lazımdır
- Hər endpoint üçün xüsusi konfiqurasiya

### 📝 Kod Nümunəsi:

```javascript
const userRouter = express.Router();
userRouter.get('/', handler);
userRouter.post('/', handler);

// Sadəcə scan edin
app.use('/users', swagger.middleware(userRouter), userRouter);
```

**⏱️ İnteqrasiya müddəti: 5 dəqiqə**

---

## 2️⃣ Scan + Metadata

### ✅ İstifadə edin:
- Mövcud router-lər var
- Detallı sənədləşdirmə lazımdır
- Kod və sənədləşdirmə ayrı olmalıdır
- Team ilə işləyirsiniz

### ❌ İstifadə etməyin:
- Kiçik prototip yaradırsınız
- Minimum konfiqurasiya lazımdır

### 📝 Kod Nümunəsi:

```javascript
// 1. Router scan
app.use('/users', swagger.middleware(userRouter), userRouter);

// 2. Metadata ayrıca
swagger
  .doc('GET', '/users', {
    summary: 'İstifadəçilər',
    tags: ['Users'],
    responses: { ... }
  })
  .doc('POST', '/users', {
    summary: 'Yarat',
    requestBody: { ... }
  });
```

**⏱️ İnteqrasiya müddəti: 15-30 dəqiqə**

---

## 3️⃣ Manual API

### ✅ İstifadə edin:
- Yeni layihə başlayırsınız
- Kiçik API yaradırsınız
- Sürətli prototip lazımdır
- Route və doc eyni yerdə olmalıdır

### ❌ İstifadə etməyin:
- Böyük layihə
- Çoxlu route var
- Team ilə işləyirsiniz

### 📝 Kod Nümunəsi:

```javascript
swagger.get('/users', handler, {
  summary: 'İstifadəçilər',
  tags: ['Users']
});

swagger.post('/users', handler, {
  summary: 'Yarat',
  requestBody: swagger.createRequestBody(...)
});
```

**⏱️ İnteqrasiya müddəti: 10 dəqiqə**

---

## 4️⃣ Group Pattern

### ✅ İstifadə edin:
- API versiyalaşdırma
- Prefix təkrarlanır
- Modulyar struktur istəyirsiniz
- Auth/Admin kimi qruplar var

### ❌ İstifadə etməyin:
- Sadə flat struktur var
- Qruplama lazım deyil

### 📝 Kod Nümunəsi:

```javascript
swagger.group('/api/v2/auth', (api) => {
  api.post('/login', handler, config);
  api.post('/register', handler, config);
  api.post('/logout', handler, config);
});
```

**⏱️ İnteqrasiya müddəti: 10-20 dəqiqə**

---

## 🎯 Tövsiyələr

### Yeni Layihə
```
1. Manual API (kiçik) və ya
2. Group Pattern (orta/böyük)
```

### Mövcud Layihə
```
1. Router Scan (sürətli) və ya
2. Scan + Metadata (detallı)
```

### Enterprise Layihə
```
Scan + Metadata
+ Advanced patterns
+ Middleware stack
```

### Prototip
```
Manual API
Sürətli və sadə
```

---

## 💡 Best Practices

### ✅ Hamısı üçün:
- Helper metodlardan istifadə edin
- Schema-ları reusable edin
- Tags-ları düzgün qruplaşdırın
- Security doğru konfiqurasiya edin
- Responses tam olsun

### ✅ Router Scan:
- Metadata sonradan əlavə edin
- Route naming convention istifadə edin

### ✅ Scan + Metadata:
- Metadata-nı ayrı faylda saxlayın
- TypeScript istifadə edin (optional)

### ✅ Manual API:
- Group pattern-lə kombinasiya edin
- Həddən artıq uzun etməyin

### ✅ Group Pattern:
- Prefix-ləri constant-da saxlayın
- Versiyalaşdırma üçün ideal

---

## 🔄 Miqrasiya

### Router Scan → Scan + Metadata
```javascript
// Öncə
app.use('/users', swagger.middleware(userRouter), userRouter);

// Sonra metadata əlavə edin
swagger.doc('GET', '/users', config);
```

### Manual API → Router Scan
```javascript
// Öncə
swagger.get('/users', handler, config);

// Sonra router yarat
const router = express.Router();
router.get('/', handler);
app.use('/users', swagger.middleware(router), router);
swagger.doc('GET', '/users', config);
```

---

## 📊 Layihə Ölçüsünə görə

| Routes Sayı | Tövsiyə | Alternativ |
|------------|---------|-----------|
| 1-10 | Manual API | Group Pattern |
| 11-50 | Scan + Metadata | Group Pattern |
| 51-100 | Router Scan | Scan + Metadata |
| 100+ | Router Scan | Modulyar struktur |

---

Sualınız varsa, issue açın! 🚀


**Yaradıldı ❤️ ilə Express.js və Swagger istifadəçiləri üçün**