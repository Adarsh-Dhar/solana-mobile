# Dine Time Backend

A Node.js backend for the Dine Time React Native restaurant app with PostgreSQL, Prisma, and Docker.

## Features

- 🔐 JWT Authentication
- 🍽️ Restaurant Management
- 📅 Reservation System
- 🛒 Order Management
- ⭐ Review & Rating System
- 🐘 PostgreSQL Database
- 🐳 Docker Support
- 🔒 Security Middleware
- 📊 Rate Limiting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Containerization**: Docker
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### 1. Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- npm or yarn

### 2. Environment Setup

```bash
# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
cd docker
docker-compose up -d

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `POST /api/restaurants` - Create restaurant (admin)
- `PUT /api/restaurants/:id` - Update restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant
- `GET /api/restaurants/:id/menu` - Get restaurant menu

### Reservations
- `GET /api/reservations/my-reservations` - Get user's reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/:id` - Get reservation by ID

### Orders
- `GET /api/orders/my-orders` - Get user's orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Reviews
- `GET /api/reviews/restaurant/:restaurantId` - Get restaurant reviews
- `POST /api/reviews` - Create review

## Database Schema

The database includes the following models:

- **User**: Authentication and user management
- **Restaurant**: Restaurant information and details
- **MenuItem**: Food items available at restaurants
- **Reservation**: Table bookings
- **Review**: User reviews and ratings
- **Order**: Food orders
- **OrderItem**: Individual items in orders

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio
npm run db:seed    # Seed database with sample data
```

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database
npm run db:push --force-reset

# Generate new migration
npx prisma migrate dev --name migration_name
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset database
docker-compose down -v
docker-compose up -d
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://dinetime_user:dinetime_password@localhost:5432/dinetime_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure production database URL
4. Set up proper CORS origins
5. Use HTTPS in production
6. Configure proper logging

## React Native Integration

The backend is designed to work with the React Native app. Use the provided `utils/api.js` and `utils/auth.js` files in your React Native project.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 