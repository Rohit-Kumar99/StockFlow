# StockFlow

**Inventory & Purchase Management Platform** — a full-stack MERN portfolio project for small retail/electronics businesses.

## Problem Statement

Small shops often track stock in spreadsheets or memory. Stock counts drift because sales, purchases, damages, and returns aren't recorded as discrete events — only the "current quantity" is edited directly. StockFlow solves this with **movement-based inventory**: every stock change creates an `InventoryMovement` record, and current stock is calculated as the sum of movements.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |

## Core Engineering Decisions

- **Movement-based inventory** — no `product.quantity` field; stock is derived from audit trail
- **Purchase order state machine** — inventory only increases when PO status becomes `received`
- **Sale validation** — prevents overselling by checking calculated stock before creating movements
- **RBAC** — admin vs staff roles with route-level authorization

## Project Structure

```
stockflow/
├── backend/          # Express REST API
├── frontend/         # React Vite app
└── StockFlow.pdf     # Build guide
```

## Prerequisites

- Node.js v20+
- MongoDB running locally (or MongoDB Atlas connection string)

## Setup

### 1. MongoDB

Install and start MongoDB locally, or use MongoDB Atlas. Default local URI:

```
mongodb://127.0.0.1:27017/stockflow
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

### 4. First-time setup

1. Open `http://localhost:5173/register` to create the first admin account
2. Log in and add categories + suppliers (Suppliers page)
3. Create products, purchase orders, receive POs, record sales
4. View inventory history and dashboard

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (first user = admin) |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List products with calculated stock |
| POST | `/api/purchase-orders` | Create draft PO |
| PUT | `/api/purchase-orders/:id/status` | Advance PO workflow |
| POST | `/api/sales` | Record sale (creates negative movements) |
| GET | `/api/inventory/movements` | Audit trail |
| GET | `/api/dashboard/summary` | Dashboard stats |

## Deployment

- **Backend**: Render (set `MONGO_URI` to Atlas, `CLIENT_URL` to Vercel domain)
- **Frontend**: Vercel (set `VITE_API_URL` to Render backend URL)
- **Database**: MongoDB Atlas free tier

## License

MIT
