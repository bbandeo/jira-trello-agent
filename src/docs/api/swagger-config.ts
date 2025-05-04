// docs/api/swagger-config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express, { Express } from 'express';
import YAML from 'yamljs';
import path from 'path';

// Cargar la especificación OpenAPI desde YAML
const swaggerSpec = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Configuración de JSDoc (si sigues usando JSDoc en routes)
const swaggerOptions = {
  definition: swaggerSpec,
  apis: [
    path.join(__dirname, '../../src/api/routes/*.ts'),
    path.join(__dirname, './routes/*.yaml'),
    path.join(__dirname, './components/*.yaml')
  ]
};

const specs = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  // Configuración UI personalizada
  const swaggerUiOptions = {
    customSiteTitle: 'Jira-Trello Agent API Docs',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .scheme-container { display: none }
    `,
    explorer: true,
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list'
    }
  };

  // Endpoint principal de documentación
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Endpoints adicionales
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Servir documentación estática
  app.use('/docs', express.static(path.join(__dirname, '../..')));
};