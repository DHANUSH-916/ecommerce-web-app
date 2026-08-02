from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from dotenv import load_dotenv
from urllib.parse import quote_plus
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from decimal import Decimal, InvalidOperation
import os


# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
db_port = os.getenv("DB_PORT")

encoded_password = quote_plus(db_password)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
)

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "connect_args": {
        "ssl": {}
    }
}

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# --------------------------------------------------
# JWT CONFIGURATION
# --------------------------------------------------

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

jwt = JWTManager(app)


# --------------------------------------------------
# ORDER STATUS CONFIGURATION
# --------------------------------------------------

ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered"
]


# --------------------------------------------------
# USER MODEL
# --------------------------------------------------

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="user"
    )


# --------------------------------------------------
# PRODUCT MODEL
# --------------------------------------------------

class Product(db.Model):

    __tablename__ = "products"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    stock = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    category = db.Column(
        db.String(100),
        nullable=True
    )


# --------------------------------------------------
# CART ITEM MODEL
# --------------------------------------------------

class CartItem(db.Model):

    __tablename__ = "cart_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    user = db.relationship("User")

    product = db.relationship("Product")

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product_cart"
        ),
    )


# --------------------------------------------------
# ORDER MODEL
# --------------------------------------------------

class Order(db.Model):

    __tablename__ = "orders"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    total_price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Pending"
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = db.relationship("User")

    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


# --------------------------------------------------
# ORDER ITEM MODEL
# --------------------------------------------------

class OrderItem(db.Model):

    __tablename__ = "order_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    product_name = db.Column(
        db.String(150),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    order = db.relationship(
        "Order",
        back_populates="items"
    )

    product = db.relationship("Product")


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def product_to_dict(product):

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "stock": product.stock,
        "category": product.category
    }


def get_current_user():

    user_id = get_jwt_identity()

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None

    return db.session.get(
        User,
        user_id
    )


def is_admin(user):

    return user and user.role == "admin"


def order_item_to_dict(item):

    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product_name,
        "quantity": item.quantity,
        "price": float(item.price),
        "subtotal": float(
            item.price * item.quantity
        )
    }


def order_to_dict(order):

    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_price": float(order.total_price),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "items": [
            order_item_to_dict(item)
            for item in order.items
        ]
    }


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "E-Commerce Backend is running!"
    }), 200


# --------------------------------------------------
# REGISTER
# --------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email and password are required"
        }), 400

    name = str(name).strip()
    email = str(email).strip().lower()

    if not name:
        return jsonify({
            "message": "Name cannot be empty"
        }), 400

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        return jsonify({
            "message": "Email already registered"
        }), 409

    hashed_password = generate_password_hash(
        password
    )

    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
        role="user"
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }), 201


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    email = str(email).strip().lower()

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not check_password_hash(
        user.password,
        password
    ):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# --------------------------------------------------
# PROFILE
# --------------------------------------------------

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def profile():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }), 200


# --------------------------------------------------
# ADMIN DASHBOARD
# --------------------------------------------------

@app.route("/api/admin", methods=["GET"])
@jwt_required()
def admin_dashboard():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    return jsonify({
        "message": "Welcome Admin",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# --------------------------------------------------
# ADD PRODUCT
# ADMIN ONLY
# --------------------------------------------------

@app.route("/api/products", methods=["POST"])
@jwt_required()
def add_product():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name")
    description = data.get("description")
    price = data.get("price")
    stock = data.get("stock")
    category = data.get("category")

    if not name or price is None or stock is None:
        return jsonify({
            "message": "Name, price and stock are required"
        }), 400

    try:
        price = Decimal(str(price))
        stock = int(stock)

    except (ValueError, TypeError, InvalidOperation):
        return jsonify({
            "message": "Price and stock must be valid numbers"
        }), 400

    if price < 0:
        return jsonify({
            "message": "Price cannot be negative"
        }), 400

    if stock < 0:
        return jsonify({
            "message": "Stock cannot be negative"
        }), 400

    name = str(name).strip()

    if not name:
        return jsonify({
            "message": "Product name cannot be empty"
        }), 400

    new_product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category
    )

    db.session.add(new_product)
    db.session.commit()

    return jsonify({
        "message": "Product added successfully",
        "product": product_to_dict(new_product)
    }), 201


# --------------------------------------------------
# GET ALL PRODUCTS
# PUBLIC
# --------------------------------------------------

@app.route("/api/products", methods=["GET"])
def get_products():

    products = db.session.execute(
        db.select(Product).order_by(Product.id)
    ).scalars().all()

    product_list = [
        product_to_dict(product)
        for product in products
    ]

    return jsonify({
        "count": len(product_list),
        "products": product_list
    }), 200


# --------------------------------------------------
# GET ONE PRODUCT
# PUBLIC
# --------------------------------------------------

@app.route(
    "/api/products/<int:product_id>",
    methods=["GET"]
)
def get_product(product_id):

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify({
        "product": product_to_dict(product)
    }), 200


# --------------------------------------------------
# UPDATE PRODUCT
# ADMIN ONLY
# --------------------------------------------------

@app.route(
    "/api/products/<int:product_id>",
    methods=["PUT"]
)
@jwt_required()
def update_product(product_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    if "name" in data:

        if (
            not data["name"]
            or not str(data["name"]).strip()
        ):
            return jsonify({
                "message": "Product name cannot be empty"
            }), 400

        product.name = str(
            data["name"]
        ).strip()

    if "description" in data:
        product.description = data["description"]

    if "category" in data:
        product.category = data["category"]

    if "price" in data:

        try:
            price = Decimal(str(data["price"]))

        except (ValueError, TypeError, InvalidOperation):
            return jsonify({
                "message": "Price must be a valid number"
            }), 400

        if price < 0:
            return jsonify({
                "message": "Price cannot be negative"
            }), 400

        product.price = price

    if "stock" in data:

        try:
            stock = int(data["stock"])

        except (ValueError, TypeError):
            return jsonify({
                "message": "Stock must be a valid integer"
            }), 400

        if stock < 0:
            return jsonify({
                "message": "Stock cannot be negative"
            }), 400

        product.stock = stock

    db.session.commit()

    return jsonify({
        "message": "Product updated successfully",
        "product": product_to_dict(product)
    }), 200


# --------------------------------------------------
# DELETE PRODUCT
# ADMIN ONLY
# --------------------------------------------------

@app.route(
    "/api/products/<int:product_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_product(product_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    deleted_product = product_to_dict(product)

    db.session.delete(product)
    db.session.commit()

    return jsonify({
        "message": "Product deleted successfully",
        "product": deleted_product
    }), 200


# --------------------------------------------------
# ADD TO CART
# --------------------------------------------------

@app.route("/api/cart", methods=["POST"])
@jwt_required()
def add_to_cart():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if product_id is None:
        return jsonify({
            "message": "Product ID is required"
        }), 400

    try:
        product_id = int(product_id)
        quantity = int(quantity)

    except (ValueError, TypeError):
        return jsonify({
            "message": (
                "Product ID and quantity "
                "must be valid integers"
            )
        }), 400

    if quantity <= 0:
        return jsonify({
            "message": "Quantity must be greater than 0"
        }), 400

    product = db.session.get(
        Product,
        product_id
    )

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    if product.stock <= 0:
        return jsonify({
            "message": "Product is out of stock"
        }), 400

    existing_item = CartItem.query.filter_by(
        user_id=user.id,
        product_id=product.id
    ).first()

    if existing_item:

        new_quantity = (
            existing_item.quantity
            + quantity
        )

        if new_quantity > product.stock:
            return jsonify({
                "message": (
                    "Requested quantity exceeds "
                    "available stock"
                )
            }), 400

        existing_item.quantity = new_quantity

        db.session.commit()

        return jsonify({
            "message": "Cart updated successfully",
            "cart_item": {
                "id": existing_item.id,
                "product_id": product.id,
                "product_name": product.name,
                "quantity": existing_item.quantity,
                "price": float(product.price),
                "subtotal": float(
                    product.price
                    * existing_item.quantity
                )
            }
        }), 200

    if quantity > product.stock:
        return jsonify({
            "message": (
                "Requested quantity exceeds "
                "available stock"
            )
        }), 400

    cart_item = CartItem(
        user_id=user.id,
        product_id=product.id,
        quantity=quantity
    )

    db.session.add(cart_item)
    db.session.commit()

    return jsonify({
        "message": "Product added to cart",
        "cart_item": {
            "id": cart_item.id,
            "product_id": product.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
            "price": float(product.price),
            "subtotal": float(
                product.price
                * cart_item.quantity
            )
        }
    }), 201


# --------------------------------------------------
# VIEW CART
# --------------------------------------------------

@app.route("/api/cart", methods=["GET"])
@jwt_required()
def get_cart():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    cart_items = db.session.execute(
        db.select(CartItem)
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.id)
    ).scalars().all()

    items = []

    total = Decimal("0.00")

    for item in cart_items:

        product = item.product

        subtotal = (
            product.price
            * item.quantity
        )

        total += subtotal

        items.append({
            "cart_item_id": item.id,
            "product": product_to_dict(product),
            "quantity": item.quantity,
            "subtotal": float(subtotal)
        })

    return jsonify({
        "items": items,
        "total_items": sum(
            item.quantity
            for item in cart_items
        ),
        "total_price": float(total)
    }), 200


# --------------------------------------------------
# UPDATE CART
# --------------------------------------------------

@app.route(
    "/api/cart/<int:cart_item_id>",
    methods=["PUT"]
)
@jwt_required()
def update_cart_item(cart_item_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    cart_item = db.session.get(
        CartItem,
        cart_item_id
    )

    if (
        not cart_item
        or cart_item.user_id != user.id
    ):
        return jsonify({
            "message": "Cart item not found"
        }), 404

    data = request.get_json(silent=True)

    if not data or "quantity" not in data:
        return jsonify({
            "message": "Quantity is required"
        }), 400

    try:
        quantity = int(data["quantity"])

    except (ValueError, TypeError):
        return jsonify({
            "message": "Quantity must be a valid integer"
        }), 400

    if quantity <= 0:
        return jsonify({
            "message": "Quantity must be greater than 0"
        }), 400

    product = cart_item.product

    if quantity > product.stock:
        return jsonify({
            "message": (
                "Requested quantity exceeds "
                "available stock"
            )
        }), 400

    cart_item.quantity = quantity

    db.session.commit()

    subtotal = (
        product.price
        * cart_item.quantity
    )

    return jsonify({
        "message": "Cart quantity updated successfully",
        "cart_item": {
            "id": cart_item.id,
            "product_id": product.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
            "price": float(product.price),
            "subtotal": float(subtotal)
        }
    }), 200


# --------------------------------------------------
# REMOVE FROM CART
# --------------------------------------------------

@app.route(
    "/api/cart/<int:cart_item_id>",
    methods=["DELETE"]
)
@jwt_required()
def remove_cart_item(cart_item_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    cart_item = db.session.get(
        CartItem,
        cart_item_id
    )

    if (
        not cart_item
        or cart_item.user_id != user.id
    ):
        return jsonify({
            "message": "Cart item not found"
        }), 404

    db.session.delete(cart_item)

    db.session.commit()

    return jsonify({
        "message": "Product removed from cart"
    }), 200


# --------------------------------------------------
# CHECKOUT
# --------------------------------------------------

@app.route("/api/checkout", methods=["POST"])
@jwt_required()
def checkout():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    cart_items = db.session.execute(
        db.select(CartItem)
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.id)
    ).scalars().all()

    if not cart_items:
        return jsonify({
            "message": "Cart is empty"
        }), 400

    total_price = Decimal("0.00")

    # Check every cart item before creating order
    for cart_item in cart_items:

        product = cart_item.product

        if not product:
            return jsonify({
                "message": (
                    "A product in your cart "
                    "no longer exists"
                )
            }), 400

        if cart_item.quantity <= 0:
            return jsonify({
                "message": "Invalid cart quantity"
            }), 400

        if cart_item.quantity > product.stock:
            return jsonify({
                "message": (
                    f"Not enough stock for "
                    f"{product.name}. "
                    f"Available: {product.stock}"
                )
            }), 400

        total_price += (
            product.price
            * cart_item.quantity
        )

    try:

        new_order = Order(
            user_id=user.id,
            total_price=total_price,
            status="Pending"
        )

        db.session.add(new_order)

        db.session.flush()

        for cart_item in cart_items:

            product = cart_item.product

            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=cart_item.quantity,
                price=product.price
            )

            db.session.add(order_item)

            product.stock -= cart_item.quantity

        for cart_item in cart_items:
            db.session.delete(cart_item)

        db.session.commit()

        return jsonify({
            "message": "Order placed successfully",
            "order": order_to_dict(new_order)
        }), 201

    except Exception:

        db.session.rollback()

        return jsonify({
            "message": (
                "Checkout failed. "
                "No changes were saved."
            )
        }), 500


# --------------------------------------------------
# USER ORDER HISTORY
# --------------------------------------------------

@app.route("/api/orders", methods=["GET"])
@jwt_required()
def get_user_orders():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    orders = db.session.execute(
        db.select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    ).scalars().all()

    return jsonify({
        "count": len(orders),
        "orders": [
            order_to_dict(order)
            for order in orders
        ]
    }), 200


# --------------------------------------------------
# GET ONE USER ORDER
# --------------------------------------------------

@app.route(
    "/api/orders/<int:order_id>",
    methods=["GET"]
)
@jwt_required()
def get_user_order(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    order = db.session.get(
        Order,
        order_id
    )

    if (
        not order
        or order.user_id != user.id
    ):
        return jsonify({
            "message": "Order not found"
        }), 404

    return jsonify({
        "order": order_to_dict(order)
    }), 200


# --------------------------------------------------
# STEP 13
# TRACK ORDER
# USER ONLY
# --------------------------------------------------

@app.route(
    "/api/orders/<int:order_id>/track",
    methods=["GET"]
)
@jwt_required()
def track_order(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    order = db.session.get(
        Order,
        order_id
    )

    # Prevent one customer from tracking
    # another customer's order.
    if (
        not order
        or order.user_id != user.id
    ):
        return jsonify({
            "message": "Order not found"
        }), 404

    try:
        current_index = ORDER_STATUSES.index(
            order.status
        )

    except ValueError:
        return jsonify({
            "message": "Order has an invalid status"
        }), 500

    tracking = []

    for index, status in enumerate(
        ORDER_STATUSES
    ):

        tracking.append({
            "status": status,
            "completed": index <= current_index,
            "current": index == current_index
        })

    return jsonify({
        "order_id": order.id,
        "current_status": order.status,
        "created_at": order.created_at.isoformat(),
        "tracking": tracking
    }), 200


# --------------------------------------------------
# ADMIN - GET ALL ORDERS
# --------------------------------------------------

@app.route(
    "/api/admin/orders",
    methods=["GET"]
)
@jwt_required()
def get_all_orders():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    orders = db.session.execute(
        db.select(Order)
        .order_by(Order.created_at.desc())
    ).scalars().all()

    result = []

    for order in orders:

        order_data = order_to_dict(order)

        order_data["customer"] = {
            "id": order.user.id,
            "name": order.user.name,
            "email": order.user.email
        }

        result.append(order_data)

    return jsonify({
        "count": len(result),
        "orders": result
    }), 200


# --------------------------------------------------
# STEP 13
# ADMIN - UPDATE ORDER STATUS
# CONTROLLED PROGRESSION
# --------------------------------------------------

@app.route(
    "/api/admin/orders/<int:order_id>/status",
    methods=["PUT"]
)
@jwt_required()
def update_order_status(order_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not is_admin(user):
        return jsonify({
            "message": "Admin access required"
        }), 403

    order = db.session.get(
        Order,
        order_id
    )

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    data = request.get_json(silent=True)

    if not data or not data.get("status"):
        return jsonify({
            "message": "Status is required"
        }), 400

    requested_status = str(
        data["status"]
    ).strip().title()

    if requested_status not in ORDER_STATUSES:
        return jsonify({
            "message": "Invalid order status",
            "allowed_statuses": ORDER_STATUSES
        }), 400

    try:
        current_index = ORDER_STATUSES.index(
            order.status
        )

    except ValueError:
        return jsonify({
            "message": "Order has an invalid current status"
        }), 500

    requested_index = ORDER_STATUSES.index(
        requested_status
    )

    # Same status
    if requested_index == current_index:

        return jsonify({
            "message": (
                f"Order is already "
                f"{order.status}"
            ),
            "order": order_to_dict(order)
        }), 200

    # Prevent moving backwards
    if requested_index < current_index:

        return jsonify({
            "message": (
                "Order status cannot move backwards"
            ),
            "current_status": order.status,
            "requested_status": requested_status
        }), 400

    # Prevent skipping stages
    if requested_index > current_index + 1:

        next_status = ORDER_STATUSES[
            current_index + 1
        ]

        return jsonify({
            "message": (
                "Order status cannot skip stages"
            ),
            "current_status": order.status,
            "next_status": next_status
        }), 400

    # Delivered is final
    if order.status == "Delivered":

        return jsonify({
            "message": (
                "Delivered order cannot be changed"
            )
        }), 400

    order.status = requested_status

    db.session.commit()

    return jsonify({
        "message": "Order status updated successfully",
        "order": order_to_dict(order)
    }), 200


# --------------------------------------------------
# CREATE TABLES AND START SERVER
# --------------------------------------------------

if __name__ == "__main__":

    with app.app_context():
        db.create_all()

    app.run(debug=True)