# 🚀 SaaS Backend Template

A **scalable and production-ready** backend template for SaaS applications, built with **NestJS**, **PostgreSQL (Prisma ORM)**, **Stripe for subscriptions**, and **Winston + Loki + Grafana for logging**.

---

## 📌 Features

✅ **Authentication & Authorization** (JWT + Role-Based Access Control)  
✅ **Subscription Management** (Stripe Checkout, Webhooks, Cancellations)  
✅ **PostgreSQL Database with Prisma ORM**  
✅ **Logging & Monitoring with Loki + Grafana**  
✅ **Docker Support** for easy deployment  
✅ **Structured Codebase** (Modular NestJS Architecture)

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/tsvetanml/saas-backend-template.git
cd saas-backend-template
```

### 2️⃣ Configure Environment Variables

Copy `.env.example` and create a `.env` file:

```sh
cp .env.example .env
```

Then update the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/saas_backend_db?schema=public
JWT_SECRET=your_jwt_secret
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3️⃣ Start Services with Docker

```sh
docker-compose up -d
```

### 4️⃣ Apply Database Migrations

```sh
npx prisma migrate dev --name init
```

### 5️⃣ Start the Server

```sh
npm run start:dev
```

The server will run at: **`http://localhost:4000`**

---

## 🛠 API Endpoints

### 🔑 **Authentication**

```http
POST /auth/register  -> Register a new user
POST /auth/login     -> Login and get JWT token
```

### 💳 **Subscriptions** (Stripe)

```http
POST /stripe/checkout       -> Start a subscription checkout
DELETE /subscriptions/cancel -> Cancel active subscription
```

### 🛠 **Admin & User Actions**

```http
GET /profile            -> Get user profile (Auth Required)
GET /subscriptions/active -> Get active subscriptions (Admin Only)
```

🔹 **Full API documentation coming soon!**

---

## 📊 Viewing Logs in Grafana

1️⃣ **Start Loki & Grafana (If not running)**

```sh
docker-compose up -d
```

2️⃣ **Open Grafana:** `http://localhost:3000`  
3️⃣ **Login:** (Default: `admin` / `admin`)  
4️⃣ **Go to "Explore" → Select "Loki" → Query Logs**

```logql
{app="saas-backend"}
```

---

## 🔮 Future Enhancements

- **WebSocket Notifications for Subscription Events**
- **Multi-Tier Subscription Plans**
- **Admin Dashboard for Subscription Management**

---

## 🏆 Contributors

Made with ❤️ by **Tsvetan**. Feel free to contribute!

---

## 📄 License

MIT License - Free for personal & commercial use.
