# 🛒 ShopZone - Full Stack E-Commerce Web Application

A modern full-stack e-commerce web application built with **React**, **Flask**, and **MySQL**. The application allows users to browse products, register, log in securely using JWT authentication, manage carts, and place orders.

---

## 🚀 Live Demo

**Frontend:**  
https://ecommerce-web-app-rho-seven.vercel.app

**Backend API:**  
https://ecommerce-web-app-hg57.onrender.com

---

## 📂 GitHub Repository

https://github.com/DHANUSH-916/ecommerce-web-app

---

## ✨ Features

- User Registration & Login
- JWT Authentication
- Secure Password Hashing
- Browse Products
- Product Search
- Category Filtering
- Product Sorting
- Shopping Cart
- Order Management
- Responsive UI
- RESTful API
- MySQL Database Integration

---

## 🛠 Tech Stack

### Frontend
- React.js
- Vite
- Axios
- React Router
- CSS

### Backend
- Python
- Flask
- Flask SQLAlchemy
- Flask JWT Extended
- Flask CORS

### Database
- MySQL (Aiven Cloud)

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Aiven MySQL

---

## 📁 Project Structure

```
ecommerce-web-app/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── models/
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/DHANUSH-916/ecommerce-web-app.git
```

```bash
cd ecommerce-web-app
```

---

## Backend Setup

```bash
cd backend
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Create a `.env` file

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=your_host
DB_PORT=27094
DB_NAME=defaultdb

JWT_SECRET_KEY=your_secret_key
```

Run backend

```bash
python app.py
```

---

## Frontend Setup

```bash
cd frontend
```

Install packages

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

Run

```bash
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/<id> | Get product details |
| POST | /api/register | Register user |
| POST | /api/login | Login user |
| GET | /api/cart | Get cart |
| POST | /api/cart | Add to cart |
| POST | /api/orders | Place order |

---

## Deployment

### Frontend
- Vercel

### Backend
- Render

### Database
- Aiven MySQL Cloud

---

## Future Improvements

- Product Images Upload
- Payment Gateway Integration
- Wishlist
- Product Reviews
- Email Notifications
- Admin Dashboard Analytics
- Order Tracking
- Coupon System

---

## Author

**Dhanush R**

GitHub  
https://github.com/DHANUSH-916

LinkedIn  
https://www.linkedin.com/in/dhanush-reddy-b2a51b25b

---

## License

This project is developed for educational and portfolio purposes.