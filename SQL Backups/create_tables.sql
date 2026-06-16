-- ==========================================
-- HITCHPARTY DATABASE V2
-- ==========================================

DROP DATABASE IF EXISTS hitchparty;

CREATE DATABASE hitchparty
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hitchparty;

-- ==========================================
-- USERS
-- ==========================================

CREATE TABLE users (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


full_name VARCHAR(150) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
phone VARCHAR(20),
photo_url VARCHAR(500),

email_verified BOOLEAN DEFAULT FALSE,
rating_average DECIMAL(3,2) DEFAULT 0.00,
is_active BOOLEAN DEFAULT TRUE,

last_login DATETIME NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP


);

-- ==========================================
-- VEHICLES
-- ==========================================

CREATE TABLE vehicles (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


user_id BIGINT NOT NULL,

brand VARCHAR(100) NOT NULL,
model VARCHAR(100) NOT NULL,
license_plate VARCHAR(10) NOT NULL UNIQUE,
color VARCHAR(50),
year SMALLINT,

is_active BOOLEAN DEFAULT TRUE,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

CONSTRAINT fk_vehicle_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE


);

-- ==========================================
-- RIDES
-- ==========================================

CREATE TABLE rides (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


driver_id BIGINT NOT NULL,
vehicle_id BIGINT NOT NULL,

origin VARCHAR(255) NOT NULL,
destination VARCHAR(255) NOT NULL,

origin_lat DECIMAL(10,8),
origin_lng DECIMAL(11,8),

destination_lat DECIMAL(10,8),
destination_lng DECIMAL(11,8),

distance_km DECIMAL(8,2),
estimated_duration_minutes INT,

departure_time DATETIME NOT NULL,

total_seats INT NOT NULL,
available_seats INT NOT NULL,

suggested_price DECIMAL(10,2),

description TEXT,

status ENUM(
    'SCHEDULED',
    'IN_PROGRESS',
    'FINISHED',
    'CANCELED'
) DEFAULT 'SCHEDULED',

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_ride_driver
    FOREIGN KEY (driver_id)
    REFERENCES users(id),

CONSTRAINT fk_ride_vehicle
    FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(id),

CONSTRAINT chk_ride_seats
    CHECK (
        total_seats > 0
        AND total_seats <= 8
        AND available_seats <= total_seats
    )


);

-- ==========================================
-- RIDE REQUESTS
-- ==========================================

CREATE TABLE ride_requests (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


ride_id BIGINT NOT NULL,
passenger_id BIGINT NOT NULL,

status ENUM(
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELED'
) DEFAULT 'PENDING',

notes TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

CONSTRAINT fk_request_ride
    FOREIGN KEY (ride_id)
    REFERENCES rides(id)
    ON DELETE CASCADE,

CONSTRAINT fk_request_passenger
    FOREIGN KEY (passenger_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

CONSTRAINT uk_ride_request
    UNIQUE (ride_id, passenger_id)


);

-- ==========================================
-- REVIEWS
-- ==========================================

CREATE TABLE reviews (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


ride_id BIGINT NOT NULL,

reviewer_id BIGINT NOT NULL,
reviewed_user_id BIGINT NOT NULL,

rating TINYINT NOT NULL,
comment TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_review_ride
    FOREIGN KEY (ride_id)
    REFERENCES rides(id)
    ON DELETE CASCADE,

CONSTRAINT fk_review_reviewer
    FOREIGN KEY (reviewer_id)
    REFERENCES users(id),

CONSTRAINT fk_reviewed_user
    FOREIGN KEY (reviewed_user_id)
    REFERENCES users(id),

CONSTRAINT chk_rating
    CHECK (rating BETWEEN 1 AND 5),

CONSTRAINT chk_self_review
    CHECK (reviewer_id <> reviewed_user_id)


);

-- ==========================================
-- USER SETTINGS
-- ==========================================

CREATE TABLE user_settings (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


user_id BIGINT NOT NULL UNIQUE,

theme ENUM(
    'LIGHT',
    'DARK'
) DEFAULT 'LIGHT',

language VARCHAR(10)
    DEFAULT 'en-US',

show_phone BOOLEAN DEFAULT FALSE,
receive_email BOOLEAN DEFAULT TRUE,
receive_push BOOLEAN DEFAULT TRUE,

CONSTRAINT fk_settings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE


);

-- ==========================================
-- QR CODES
-- ==========================================

CREATE TABLE qr_codes (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


ride_id BIGINT NOT NULL,

code VARCHAR(255) NOT NULL UNIQUE,

expires_at DATETIME NOT NULL,

is_used BOOLEAN DEFAULT FALSE,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_qrcode_ride
    FOREIGN KEY (ride_id)
    REFERENCES rides(id)
    ON DELETE CASCADE


);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
id BIGINT AUTO_INCREMENT PRIMARY KEY,


user_id BIGINT NOT NULL,

title VARCHAR(255) NOT NULL,
message TEXT NOT NULL,

is_read BOOLEAN DEFAULT FALSE,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE


);

-- ==========================================
-- PAYMENTS
-- ==========================================

CREATE TABLE payments (
id BIGINT AUTO_INCREMENT PRIMARY KEY,

request_id BIGINT NOT NULL,
ride_id BIGINT NOT NULL,

passenger_id BIGINT NOT NULL,
driver_id BIGINT NOT NULL,

amount DECIMAL(10,2) NOT NULL,

status ENUM(
    'PENDING',
    'PAID',
    'HOLD',
    'RELEASED',
    'REFUNDED',
    'CANCELED'
) DEFAULT 'PENDING',

payment_method ENUM(
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD'
) DEFAULT 'PIX',

receipt_url VARCHAR(500),

gateway_transaction VARCHAR(255),

paid_at DATETIME NULL,
released_at DATETIME NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

CONSTRAINT fk_payment_request
    FOREIGN KEY (request_id)
    REFERENCES ride_requests(id)
    ON DELETE CASCADE,

CONSTRAINT fk_payment_ride
    FOREIGN KEY (ride_id)
    REFERENCES rides(id)
    ON DELETE CASCADE,

CONSTRAINT fk_payment_passenger
    FOREIGN KEY (passenger_id)
    REFERENCES users(id),

CONSTRAINT fk_payment_driver
    FOREIGN KEY (driver_id)
    REFERENCES users(id),

CONSTRAINT chk_payment_amount
    CHECK (amount > 0)


);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_vehicles_user
ON vehicles(user_id);

CREATE INDEX idx_rides_driver
ON rides(driver_id);

CREATE INDEX idx_rides_origin
ON rides(origin);

CREATE INDEX idx_rides_destination
ON rides(destination);

CREATE INDEX idx_rides_departure
ON rides(departure_time);

CREATE INDEX idx_rides_status
ON rides(status);

CREATE INDEX idx_requests_passenger
ON ride_requests(passenger_id);

CREATE INDEX idx_requests_ride
ON ride_requests(ride_id);

CREATE INDEX idx_requests_status
ON ride_requests(status);

CREATE INDEX idx_reviews_user
ON reviews(reviewed_user_id);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_payments_request
ON payments(request_id);

CREATE INDEX idx_payments_ride
ON payments(ride_id);

CREATE INDEX idx_payments_passenger
ON payments(passenger_id);

CREATE INDEX idx_payments_driver
ON payments(driver_id);

CREATE INDEX idx_payments_status
ON payments(status);
