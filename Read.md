# ExtremeFit Database Setup - Para el Equipo

## 🚀 Configuración Completa para Desarrolladores

### 1. **Configurar PostgreSQL con Docker**

```bash
# Crear y ejecutar el container de PostgreSQL
docker run --name extremefit_container 
  -e POSTGRES_PASSWORD=your_password 
  -d -p 5433:5432 
  -v postgres_data:/var/lib/postgresql/data 
  postgres

# Verificar que esté corriendo
docker ps
```

### 2. **Crear la base de datos de desarrollo**

```bash
# Conectar al container
docker exec -it extremefit_container psql -U postgres

# Crear la base de datos
CREATE DATABASE extremefit_dev;

# Salir
\q
```

### 3. **Ejecutar el schema de la base de datos**

**Opción A - Con DataGrip:**
1. Conectar DataGrip a:
   - Host: `localhost`
   - Port: `5433`
   - Database: `extremefit_dev`
   - User: `postgres`
   - Password: `your_password`

2. Ejecutar el archivo `database/schema.sql`

**Opción B - Con comando:**
```bash
# Si tienes psql instalado localmente
psql -h localhost -p 5433 -U postgres -d extremefit_dev -f database/schema.sql
```

### 4. **Configurar el backend**

```bash
# Instalar dependencias
cd server
npm install express pg dotenv cors
npm install -D nodemon

# Crear archivo .env basado en .env.example
cp .env.example .env

# Editar .env con tus credenciales:
# NODE_ENV=development
# PORT=5001
# DB_HOST=localhost
# DB_PORT=5433
# DB_NAME=extremefit_dev
# DB_USER=postgres
# DB_PASSWORD=your_password
```

### 5. **Iniciar el servidor**

```bash
# Modo desarrollo (con auto-restart)
npm run dev

# O modo normal
npm start
```

### 6. **Probar que todo funciona**

**Pruebas básicas:**
- ✅ `http://localhost:5001/` → "ExtremeFit API is running!"
- ✅ `http://localhost:5001/api/test-db` → Conexión a DB exitosa
- ✅ `http://localhost:5001/api/items` → Array vacío `[]`

**Crear usuario de prueba:**
```bash
curl -X POST http://localhost:5001/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@extremefit.com",
    "password_hash": "testpassword",
    "phone": "787-555-0000"
  }'
```

### 7. **Estructura de la base de datos**

**Tablas creadas:**
- `users` - Usuarios/clientes
- `categories` - Categorías de productos  
- `products` - Catálogo de productos
- `cart` - Carrito de compras
- `wishlist` - Lista de deseos
- `orders` - Órdenes de compra
- `order_items` - Items de cada orden
- `addresses` - Direcciones de envío
- `payment_methods` - Métodos de pago

**Conexión de desarrollo:**
- Host: `localhost:5433`
- Database: `extremefit_dev`  
- User: `postgres`
- Password: `your_password`

### 8. **Comandos útiles de Docker**

```bash
# Ver containers corriendo
docker ps

# Iniciar container (si está parado)
docker start extremefit_container

# Parar container
docker stop extremefit_container

# Ver logs del container
docker logs extremefit_container

# Conectar a PostgreSQL desde terminal
docker exec -it extremefit_container psql -U postgres -d extremefit_dev
```

### 9. **API Endpoints disponibles**

**Usuarios (para pruebas):**
- `GET /api/items` - Obtener todos los usuarios
- `GET /api/items/:id` - Obtener usuario por ID
- `POST /api/items` - Crear nuevo usuario
- `PUT /api/items/:id` - Actualizar usuario
- `DELETE /api/items/:id` - Eliminar usuario

**Utilidades:**
- `GET /` - Status de la API
- `GET /api/test-db` - Probar conexión a BD

### 10. **Troubleshooting común**

**Error: "Port 5432 already in use"**
- Usar puerto diferente: `-p 5434:5432` en lugar de `-p 5433:5432`

**Error: "Container name already exists"**
```bash
docker rm extremefit_container
```

**Error: "Cannot connect to database"**
- Verificar que el container esté corriendo: `docker ps`
- Verificar credenciales en `.env`

**Error: "Module not found"**
```bash
npm install
```
