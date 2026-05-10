# 🚀 Plataforma de Encuestas SaaS - Analíticas en Tiempo Real - FrontEnd

Una solución moderna para la gestión de encuestas, diseñada con una arquitectura **Serverless** escalable en AWS y una interfaz de usuario de alta gama enfocada en la visualización de datos en tiempo real.

![Vista Previa](https://via.placeholder.com/1200x600.png?text=SaaS+Survey+Dashboard+Preview)

## ✨ Características Principales

- **Tablero de Control en Tiempo Real**: Visualización instantánea de los resultados mediante WebSockets utilizando **AWS AppSync**.
- **Portal del Encuestado**: Interfaz intuitiva para que los usuarios finales busquen y respondan las encuestas disponibles.
- **Seguridad Empresarial**: Autenticación de usuarios y protección de rutas administrativas gestionada por **AWS Cognito**.
- **Arquitectura Basada en Eventos**: Procesamiento de datos asíncrono mediante **DynamoDB Streams** y funciones Lambda.
- **Estética Premium**: Interfaz moderna con efectos de cristal (glassmorphism), micro-animaciones y diseño totalmente adaptativo (responsive).
- **Control de Participación**: Seguimiento de encuestas completadas por correo electrónico para evitar duplicidad de respuestas.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework**: React 19 + TypeScript
- **Estilos**: Vanilla CSS (Sistema de diseño personalizado)
- **Gráficos**: Recharts para visualización de datos
- **API**: Axios con interceptores para gestión de tokens
- **Comunicación**: AWS Amplify (Autenticación y PubSub)
- **Enrutamiento**: React Router 7

### Backend (AWS Serverless)
- **Cómputo**: AWS Lambda (Node.js + TypeScript)
- **API**: Amazon API Gateway (REST)
- **Mensajería**: AWS AppSync (GraphQL Subscriptions)
- **Base de Datos**: Amazon DynamoDB
- **Identidad**: AWS Cognito User Pools

## 🚀 Instalación y Configuración local

### Requisitos previos
- Node.js (v20 o superior)
- NPM (o el gestor de paquetes de tu preferencia)
- Infraestructura de AWS configurada

### Configuración del Frontend
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/jessusvelasquez/SaaSSurveyFrontEnd.git
   cd SaaSSurveyFrontEnd
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno (Crear archivo `.env` en la raíz):
   ```env
   VITE_API_GATEWAY_URL=tu_url_de_api_gateway
   VITE_APPSYNC_URL=tu_url_de_appsync
   VITE_APPSYNC_API_KEY=tu_api_key
   VITE_COGNITO_USER_POOL_ID=tu_pool_id
   VITE_COGNITO_CLIENT_ID=tu_client_id
   ```

4. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

## 🛤️ Rutas del Aplicativo

### Públicas y Encuestados
- `/login`: Acceso administrativo.
- `/surveys`: Portal público con la lista de encuestas publicadas.
- `/survey/:id`: Interfaz para responder una encuesta específica.

### Administración (Protegidas)
- `/admin`: Panel principal con el listado de encuestas creadas.
- `/admin/surveys/new`: Creador de nuevas encuestas y preguntas.
- `/admin/surveys/:id/edit`: Editor de encuestas existentes.
- `/admin/surveys/:id/results`: Visualización de analíticas en tiempo real.

## 🏗️ Resumen de la Arquitectura

El sistema utiliza un flujo de datos optimizado para el rendimiento:
1. El usuario envía sus respuestas a través de **API Gateway**.
2. Los datos se almacenan de forma segura en **DynamoDB**.
3. Un **DynamoDB Stream** activa automáticamente la Lambda de análisis.
4. Los resultados agregados se envían a los suscriptores mediante una mutación de **AppSync**.
5. Los paneles de administración se actualizan en milisegundos sin necesidad de recargar la página.

## 📄 Licencia

Este proyecto se distribuye bajo la Licencia MIT.
