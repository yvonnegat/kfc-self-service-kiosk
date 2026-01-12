-- KFC Kiosk Database Setup
-- Run this script to set up the database

CREATE DATABASE IF NOT EXISTS kfc_kiosk;
USE kfc_kiosk;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('manager', 'kitchen', 'customer') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Customization options table
CREATE TABLE customization_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_item_id INT NOT NULL,
  option_type ENUM('size', 'spice', 'addon') NOT NULL,
  option_name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('card', 'mobile_money') NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  order_status ENUM('new', 'in_progress', 'ready', 'completed', 'cancelled') DEFAULT 'new',
  estimated_wait_time INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

-- Order items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Order item customizations table
CREATE TABLE order_item_customizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  customization_option_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  FOREIGN KEY (customization_option_id) REFERENCES customization_options(id)
);

-- Insert sample data

-- Users
INSERT INTO users (username, password_hash, role) VALUES
('manager', '$2b$10$NdkOKG7L1dZrX0faSL1aru.ecn2ttJFTSDkuhetLnMShSdgIRo5Sa', 'manager'),
('kitchen', '$2b$10$dvPYhJ.ZVh4frhKWL5lr8OW.Dw2zA4Ec0rctD5CGd1KklTqUdu7EO', 'kitchen'),
('customer', '$2b$10$6DHmQfJYwz8RjpeBjdlL5.3XFH8SN5cF57AOFP3VpJUFQGnfbDnze', 'customer');

-- Categories
INSERT INTO categories (name, display_order) VALUES
('Chicken Meals', 1),
('Burgers', 2),
('Sides', 3),
('Drinks', 4),
('Desserts', 5);

-- Menu items
INSERT INTO menu_items (category_id, name, description, base_price, image_url, stock_quantity, low_stock_threshold) VALUES
(1, 'Original Recipe Chicken', 'Crispy fried chicken with 11 herbs and spices', 12.99, '/images/chicken.jpg', 50, 10),
(1, 'Extra Crispy Chicken', 'Extra crispy fried chicken', 13.99, '/images/extra-crispy.jpg', 45, 10),
(2, 'Zinger Burger', 'Spicy chicken burger with lettuce and mayo', 8.99, '/images/zinger.jpg', 30, 5),
(3, 'French Fries', 'Golden crispy fries', 3.99, '/images/fries.jpg', 100, 20),
(4, 'Coca Cola', 'Refreshing cola drink', 2.49, '/images/cola.jpg', 200, 50);

-- Customization options
INSERT INTO customization_options (menu_item_id, option_type, option_name, price_modifier) VALUES
(1, 'size', 'Large', 2.00),
(1, 'spice', 'Extra Spicy', 0.50),
(2, 'size', 'Large', 2.00),
(3, 'size', 'Large', 1.00),
(4, 'size', 'Large', 1.00);