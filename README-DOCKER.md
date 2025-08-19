# Budibase Docker Setup and Management

This guide covers how to run and manage Budibase using the official Docker image.

## Quick Start

1. **Start Budibase:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Access Budibase:**
   Open http://localhost:10000 in your browser

3. **Stop Budibase:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## Basic Operations

### 🚀 Starting Budibase
```bash
# From your project directory
cd /Users/yus6/Documents/Thesis/Prototypes/prototype3/LCD-AI-with-budibase
docker-compose -f docker-compose.prod.yml up -d
```
- `-d` runs it in background (detached mode)
- Access at: http://localhost:10000

### 🛑 Stopping Budibase
```bash
docker-compose -f docker-compose.prod.yml down
```
- Stops and removes the container
- **Data is preserved** in the Docker volume

### 🔄 Restarting Budibase
```bash
docker-compose -f docker-compose.prod.yml restart
```
- Quick restart without losing data

### 📋 Check Status
```bash
# See if it's running
docker ps

# Check health status
docker-compose -f docker-compose.prod.yml ps
```

### 📝 View Logs
```bash
# Live logs (Ctrl+C to exit)
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 🔧 Update to Latest Version
```bash
# Pull latest image
docker-compose -f docker-compose.prod.yml pull

# Restart with new version
docker-compose -f docker-compose.prod.yml up -d
```

## Data Management

### 🗂️ Data Location
Your data is automatically stored in a Docker volume named `lcd-ai-with-budibase_budibase_data`.

```bash
# View all Docker volumes
docker volume ls | grep budibase
```

### 💾 Backup Data (Optional)
```bash
# Create a backup of your Budibase data
docker run --rm -v lcd-ai-with-budibase_budibase_data:/data -v $(pwd):/backup alpine tar czf /backup/budibase-backup.tar.gz -C /data .
```

### 🧹 Complete Cleanup (⚠️ **Deletes all data!**)
```bash
# Stop and remove everything including data
docker-compose -f docker-compose.prod.yml down -v

# Remove the image too
docker rmi budibase/budibase:latest
```

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Start | `docker-compose -f docker-compose.prod.yml up -d` |
| Stop | `docker-compose -f docker-compose.prod.yml down` |
| Restart | `docker-compose -f docker-compose.prod.yml restart` |
| Status | `docker-compose -f docker-compose.prod.yml ps` |
| Logs | `docker-compose -f docker-compose.prod.yml logs -f` |
| Update | `docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d` |

## Shell Aliases (Optional)

Add these to your `~/.zshrc` or `~/.bashrc` for easier management:

```bash
# Budibase Docker aliases
alias budi-start='docker-compose -f docker-compose.prod.yml up -d'
alias budi-stop='docker-compose -f docker-compose.prod.yml down'
alias budi-restart='docker-compose -f docker-compose.prod.yml restart'
alias budi-status='docker-compose -f docker-compose.prod.yml ps'
alias budi-logs='docker-compose -f docker-compose.prod.yml logs -f'
alias budi-update='docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d'
```

After adding aliases, reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

Then use simple commands:
- `budi-start` - Start Budibase
- `budi-stop` - Stop Budibase  
- `budi-logs` - View logs
- `budi-status` - Check status

## Configuration

The Docker setup uses the following environment variables (defined in `docker-compose.prod.yml`):

- `JWT_SECRET` - Secures user sessions
- `MINIO_ACCESS_KEY` & `MINIO_SECRET_KEY` - File storage credentials
- `REDIS_PASSWORD` - Cache database password
- `COUCHDB_USER` & `COUCHDB_PASSWORD` - Main database credentials
- `INTERNAL_API_KEY` - Internal API access key

⚠️ **For production use**, change these default values to secure random strings.

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Check if port 10000 is already in use
netstat -an | grep 10000
```

### Can't access http://localhost:10000
1. Wait 30-60 seconds for the container to fully start
2. Check container health: `docker-compose -f docker-compose.prod.yml ps`
3. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`

### Reset everything
```bash
# Complete reset (deletes all data!)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## Access Information

- **URL**: http://localhost:10000
- **Container**: `lcd-ai-with-budibase-budibase-1`
- **Data Volume**: `lcd-ai-with-budibase_budibase_data`
- **Network**: `lcd-ai-with-budibase_default`

---

**Your Budibase instance is ready to use! 🚀**

For more advanced configuration options, visit the [official Budibase documentation](https://docs.budibase.com).