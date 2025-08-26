# ExtremeFit Database Setup

Walk through set up for a PostgreSQL database using Docker and connecting it to DataGrip for database management.

## Prerequisites

* Docker installed on your machine
* DataGrip IDE (or any PostgreSQL client)

## Database Setup with Docker

### 1. Check for Port Conflicts

First, verify that port 5432 isn't already in use:

```bash
# Check what's using port 5432
lsof -i :5432

# Check for existing PostgreSQL processes
ps aux | grep postgres
```

If you have a local PostgreSQL installation running, you can either stop it or use a different port for Docker (recommended).

### 2. Create and Run PostgreSQL Container

Run the following command to create and start your PostgreSQL container:

```bash
docker run --name extremefit_container -e POSTGRES_PASSWORD=extremefit123 -d -p 5433:5432 -v postgres_data:/var/lib/postgresql/data postgres
```

**Command breakdown:**

* `--name extremefit_container`: Names the container
* `-e POSTGRES_PASSWORD=extremefit123`: Sets the postgres user password as an environmental variable
* `-d`: Runs in detached mode (background)
* `-p 5433:5432`: Maps host port 5433 to container port 5432
* `-v postgres_data:/var/lib/postgresql/data`: Creates a persistent volume for data
* `postgres`: Uses the official PostgreSQL Docker image

### 3. Verify Container is Running

```bash
# Check running containers
docker ps

# View container logs
docker logs extremefit_container
```

### 4. Create Development Database

Connect to the PostgreSQL instance and create your development database:

```bash
# Access PostgreSQL command line
docker exec -it extremefit_container psql -U postgres

# Create development database
CREATE DATABASE extremefit_dev;

# Create test database (optional)
CREATE DATABASE extremefit_test;

# Exit PostgreSQL
\q
```

## DataGrip Setup

### 1. Create New Data Source

1. Open DataGrip
2. Click the `+` button or go to `File` → `New` → `Data Source` → `PostgreSQL`

### 2. Configure Connection

Enter the following connection details:

* **Name:** `extremefit_dev@localhost` (or customize as needed)
* **Host:** `localhost`
* **Port:** `5433`
* **Database:** `extremefit_dev`
* **User:** `postgres`
* **Password:** `extremefit123`

### 3. Test Connection

1. Click "Test Connection"
2. Download PostgreSQL drivers if prompted
3. Verify the connection is successful

### 4. Additional Connections (Optional)

You can create separate connections for different environments:

* **Development:** Database `extremefit_dev`
* **Testing:** Database `extremefit_test`
* **Production:** (Use separate server/credentials)

## Database Connection Details

For your application configuration, use these connection parameters:

```
Host: localhost
Port: 5433
Database: extremefit_dev
Username: postgres
Password: extremefit123
```



## Environment Variables (Recommended)

For your application, use environment variables:

```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=extremefit_dev
DB_USER=postgres
DB_PASSWORD=extremefit123
```


## Useful Docker Commands

```bash
# Start the container
docker start extremefit_container

# Stop the container
docker stop extremefit_container

# View container logs
docker logs extremefit_container

# Access PostgreSQL command line
docker exec -it extremefit_container psql -U postgres

# Remove container (when stopped)
docker rm extremefit_container

# Remove container and volume (WARNING: deletes all data)
docker rm extremefit_container
docker volume rm postgres_data
```

## Troubleshooting:

### Port Already in Use Error

If you get a "port already in use" error:

1. Use a different port: `-p 5434:5432`
2. Or stop existing PostgreSQL service: `brew services stop postgresql`

### Container Name Conflict

If container name already exists:

```bash
docker rm extremefit_container
```

### Connection Issues

* Verify container is running: `docker ps`
* Check logs: `docker logs extremefit_container`
* Ensure correct port (5433) in DataGrip settings
