const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

swaggerDocument = YAML.load('./swagger.yaml');

module.exports = function(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}