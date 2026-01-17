import  swaggerUi  from 'swagger-ui-express'

class SwaggerExpressAutomate {
  constructor(app, options = {}) {
    this.app = app;
    this.options = {
      info: {
        title: options.title || 'API Documentation',
        version: options.version || '1.0.0',
        description: options.description || 'Auto-generated API documentation',
      },
      host: options.host || 'localhost:3000',
      basePath: options.basePath || '/api',
      schemes: options.schemes || ['http'],
      servers: options.servers || [],
      tags: options.tags || [],
      securityDefinitions: options.securityDefinitions || {},
      ...options
    };
    this.routes = new Map();
    this.routeConfigs = new Map();
  }

  /**
   * Express router və routes scan 
   */
  scanRouter(router, basePath = '') {
    if (!router || !router.stack) return this;

    router.stack.forEach(layer => {
      if (layer.route) {
        const fullPath = this._normalizePath(basePath + layer.route.path);
        const methods = Object.keys(layer.route.methods);

        methods.forEach(method => {
          this._addScannedRoute(method.toUpperCase(), fullPath, layer.route);
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        let routePath = this._extractRoutePath(layer.regexp);
        this.scanRouter(layer.handle, basePath + routePath);
      }
    });

    return this;
  }

  /**
   * Middleware - app.use() use
   */
  middleware(routerOrPath, router) {
    // app.use(swagger.middleware(router))
    if (typeof routerOrPath === 'function' || routerOrPath.stack) {
      this.scanRouter(routerOrPath);
      return (req, res, next) => next();
    }

    // app.use('/api', swagger.middleware(router))
    if (router) {
      this.scanRouter(router, routerOrPath);
      return (req, res, next) => next();
    }

    return (req, res, next) => next();
  }

  /**
   * Manual route  add old api 
   */
  addRoute(method, path, handler, config = {}) {
    const normalizedPath = this._normalizePath(path);
    const routeKey = `${method.toUpperCase()}:${normalizedPath}`;

    this.routeConfigs.set(routeKey, {
      method: method.toUpperCase(),
      path: normalizedPath,
      config: config
    });

    this.app[method.toLowerCase()](path, handler);
    return this;
  }

  /**
   * Decorator pattern - route 
   */
  doc(method, path, config) {
    const normalizedPath = this._normalizePath(path);
    const routeKey = `${method.toUpperCase()}:${normalizedPath}`;

    this.routeConfigs.set(routeKey, {
      method: method.toUpperCase(),
      path: normalizedPath,
      config: config
    });

    return this;
  }

  /**
   * Route group 
   */
  group(prefix, callback) {
    const routes = [];
    const originalAdd = this.addRoute.bind(this);

    this.addRoute = (method, path, handler, config) => {
      const fullPath = this._normalizePath(prefix + path);
      routes.push({ method, path: fullPath, handler, config });
      return originalAdd(method, fullPath, handler, config);
    };

    callback(this);

    this.addRoute = originalAdd;

    return this;
  }

  /**
   * HTTP metodları
   */
  get(path, handler, config) {
    return this.addRoute('GET', path, handler, config);
  }

  post(path, handler, config) {
    return this.addRoute('POST', path, handler, config);
  }

  put(path, handler, config) {
    return this.addRoute('PUT', path, handler, config);
  }

  delete(path, handler, config) {
    return this.addRoute('DELETE', path, handler, config);
  }

  patch(path, handler, config) {
    return this.addRoute('PATCH', path, handler, config);
  }

  /**
   * Helper metodlar
   */
  createSchema(properties, required = []) {
    return {
      type: 'object',
      properties: properties,
      required: required
    };
  }

  createParameter(name, location, type = 'string', required = false, description = '') {
    return {
      name: name,
      in: location,
      required: required,
      description: description,
      schema: { type: type }
    };
  }

  createRequestBody(schema, description = 'Request body', required = true) {
    return {
      required: required,
      description: description,
      content: {
        'application/json': {
          schema: schema
        }
      }
    };
  }

  createResponse(code, description, schema = null) {
    const response = {
      description: description
    };

    if (schema) {
      response.content = {
        'application/json': {
          schema: schema
        }
      };
    }

    return { [code]: response };
  }

  /**
   * Swagger spec generasiya 
   */
  generateSwaggerSpec() {
    const paths = {};

    this.routes.forEach((routeInfo, routeKey) => {
      const { method, path } = routeInfo;
      const config = this.routeConfigs.get(routeKey);

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method.toLowerCase()] = this._buildOperation(
        routeInfo,
        config ? config.config : null
      );
    });

    const swaggerSpec = {
      openapi: '3.0.0',
      info: this.options.info,
      servers: this.options.servers.length > 0 ? this.options.servers : [
        {
          url: `${this.options.schemes[0]}://${this.options.host}${this.options.basePath}`,
          description: 'API Server'
        }
      ],
      tags: this.options.tags,
      paths: paths,
      components: {
        securitySchemes: this.options.securityDefinitions
      }
    };

    return swaggerSpec;
  }

  /**
   * Swagger UI create
   */
  setupSwaggerUI(docsPath = '/api-docs') {
    const swaggerSpec = this.generateSwaggerSpec();

    // JSON endpoint
    this.app.get(`${docsPath}.json`, (req, res) => {
      res.json(swaggerSpec);
    });

    // Swagger UI
    this.app.use(docsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: this.options.info.title,
      customCss: '.swagger-ui .topbar { display: none }'
    }));

    console.log(`📚 Swagger UI: http://${this.options.host}${docsPath}`);
    console.log(`📄 Swagger JSON: http://${this.options.host}${docsPath}.json`);

    return this;
  }

  /**
   * Private: Route path normalizasion
   */
  _normalizePath(path) {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  /**
   * Private: RegExp-dən route path 
   */
  _extractRoutePath(regexp) {
    const source = regexp.source;
    let path = source
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '')
      .replace(/\\\//g, '/')
      .replace(/\^/g, '')
      .replace(/\$/g, '')
      .replace(/\?\(\?\=/g, '');

    return path || '';
  }

  /**
   * Private: Scan edilmiş route əlavə edir
   */
  _addScannedRoute(method, path, expressRoute) {
    const routeKey = `${method}:${path}`;

    if (!this.routes.has(routeKey)) {
      this.routes.set(routeKey, {
        method: method,
        path: path,
        expressRoute: expressRoute
      });
    }
  }

  /**
   * Private: Operation obyekti yaradır
   */
  _buildOperation(routeInfo, config) {
    const { method, path } = routeInfo;

    const operation = {
      summary: config?.summary || `${method} ${path}`,
      description: config?.description || '',
      tags: config?.tags || ['default'],
      responses: config?.responses || {
        200: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      }
    };

    if (config?.parameters && config.parameters.length > 0) {
      operation.parameters = config.parameters;
    } else {
      const pathParams = this._extractPathParams(path);
      if (pathParams.length > 0) {
        operation.parameters = pathParams.map(param => ({
          name: param,
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }));
      }
    }

    if (config?.requestBody) {
      operation.requestBody = config.requestBody;
    }

    if (config?.security && config.security.length > 0) {
      operation.security = config.security;
    }

    return operation;
  }

  /**
   * Private: Path-dan parametrləri çıxarır
   */
  _extractPathParams(path) {
    const params = [];
    const matches = path.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    for (const match of matches) {
      params.push(match[1]);
    }
    return params;
  }
}

export default SwaggerExpressAutomate;