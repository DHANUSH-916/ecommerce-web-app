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
import os


# --------------------------------------------------
# LOAD ENVIRONMENT VARIABLES
# --------------------------------------------------

load_dotenv()

app = Flask(__name__)


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")

encoded_password = quote_plus(db_password)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_user}:{encoded_password}@{db_host}/{db_name}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# --------------------------------------------------
# JWT CONFIGURATION
# --------------------------------------------------

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

jwt = JWTManager(app)


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

    user = db.relationship(
        "User"
    )

    product = db.relationship(
        "Product"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product_cart"
        ),
    )


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

    data = request.get_json()

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

    name = name.strip()
    email = email.strip().lower()

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

    data = request.get_json()

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

    email = email.strip().lower()

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

    if user.role != "admin":
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

    if user.role != "admin":
        return jsonify({
            "message": "Admin access required"
        }), 403

    data = request.get_json()

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
        price = float(price)
        stock = int(stock)
    except (ValueError, TypeError):
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

    new_product = Product(
        name=name.strip(),
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

@app.route("/api/products/<int:product_id>", methods=["GET"])
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

@app.route("/api/products/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "admin":
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

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    if "name" in data:

        if not data["name"] or not str(data["name"]).strip():
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
            price = float(data["price"])
        except (ValueError, TypeError):
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

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "admin":
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
# JWT REQUIRED
# POST /api/cart
# --------------------------------------------------

@app.route("/api/cart", methods=["POST"])
@jwt_required()
def add_to_cart():

    user = get_current_user()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    data = request.get_json()

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
            "message": "Product ID and quantity must be valid integers"
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
            existing_item.quantity + quantity
        )

        if new_quantity > product.stock:
            return jsonify({
                "message": "Requested quantity exceeds available stock"
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
                    product.price * existing_item.quantity
                )
            }
        }), 200

    if quantity > product.stock:
        return jsonify({
            "message": "Requested quantity exceeds available stock"
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
                product.price * cart_item.quantity
            )
        }
    }), 201


# --------------------------------------------------
# VIEW CART
# JWT REQUIRED
# GET /api/cart
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
    total = 0.0

    for item in cart_items:

        product = item.product

        subtotal = (
            float(product.price) *
            item.quantity
        )

        total += subtotal

        items.append({
            "cart_item_id": item.id,
            "product": product_to_dict(product),
            "quantity": item.quantity,
            "subtotal": round(subtotal, 2)
        })

    return jsonify({
        "items": items,
        "total_items": sum(
            item.quantity
            for item in cart_items
        ),
        "total_price": round(total, 2)
    }), 200


# --------------------------------------------------
# UPDATE CART QUANTITY
# JWT REQUIRED
# PUT /api/cart/<cart_item_id>
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

    # Also prevents users from editing another user's cart
    if not cart_item or cart_item.user_id != user.id:
        return jsonify({
            "message": "Cart item not found"
        }), 404

    data = request.get_json()

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
            "message": "Requested quantity exceeds available stock"
        }), 400

    cart_item.quantity = quantity

    db.session.commit()

    subtotal = (
        float(product.price) *
        cart_item.quantity
    )

    return jsonify({
        "message": "Cart quantity updated successfully",
        "cart_item": {
            "id": cart_item.id,
            "product_id": product.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
            "price": float(product.price),
            "subtotal": round(subtotal, 2)
        }
    }), 200


# --------------------------------------------------
# REMOVE FROM CART
# JWT REQUIRED
# DELETE /api/cart/<cart_item_id>
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

    if not cart_item or cart_item.user_id != user.id:
        return jsonify({
            "message": "Cart item not found"
        }), 404

    db.session.delete(cart_item)
    db.session.commit()

    return jsonify({
        "message": "Product removed from cart"
    }), 200


# --------------------------------------------------
# CREATE TABLES AND START SERVER
# --------------------------------------------------

if __name__ == "__main__":

    with app.app_context():
        db.create_all()

    app.run(debug=True)