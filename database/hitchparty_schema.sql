-- ============================================================================
-- HP-DB-001 | HITCHPARTY - SCHEMA LIMPO DO MVP
-- ============================================================================
-- Este script recria o banco do zero para o MVP atual.
-- Nao executa inserts mockados e mantem apenas estruturas usadas pelo app:
-- usuarios, veiculos, caronas, solicitacoes e mensagens de chat.
-- ============================================================================

DROP DATABASE IF EXISTS hitchparty;

CREATE DATABASE hitchparty
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hitchparty;

-- ============================================================================
-- HP-DB-002 | USERS
-- ============================================================================
-- Armazena contas de motorista/passageiro. A senha fica somente no backend e
-- nunca deve ser enviada para o frontend.
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    photo_url VARCHAR(500),
    rating_average DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_rating
        CHECK (rating_average >= 0 AND rating_average <= 5)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-DB-003 | VEHICLES
-- ============================================================================
-- Cada veiculo pertence a um usuario e pode receber imagem enviada por upload.
CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year SMALLINT NOT NULL,
    color VARCHAR(50) NOT NULL,
    license_plate VARCHAR(10) NOT NULL,
    seats INT NOT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_vehicles_license_plate UNIQUE (license_plate),
    CONSTRAINT fk_vehicles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_vehicles_year
        CHECK (year BETWEEN 1980 AND 2100),
    CONSTRAINT chk_vehicles_seats
        CHECK (seats BETWEEN 1 AND 8)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-RIDE-001 | RIDES
-- ============================================================================
-- Guarda a carona criada pelo motorista, incluindo rota, horario e vagas.
CREATE TABLE rides (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    origin_lat DECIMAL(10,8) NULL,
    origin_lng DECIMAL(11,8) NULL,
    destination_lat DECIMAL(10,8) NULL,
    destination_lng DECIMAL(11,8) NULL,
    departure_time DATETIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    suggested_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT NULL,
    status ENUM(
        'SCHEDULED',
        'PENDING_PASSENGER_CONFIRMATION',
        'IN_PROGRESS',
        'FINISHED',
        'CANCELED'
    )
        NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rides_driver
        FOREIGN KEY (driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rides_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_rides_seats
        CHECK (
            total_seats BETWEEN 1 AND 8
            AND available_seats >= 0
            AND available_seats <= total_seats
        ),
    CONSTRAINT chk_rides_price
        CHECK (suggested_price >= 0)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-RIDE-002 | RIDE REQUESTS
-- ============================================================================
-- Registra a solicitacao do passageiro e a decisao do motorista.
CREATE TABLE ride_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    driver_id BIGINT NOT NULL,
    status ENUM(
        'PENDING',
        'ACCEPTED',
        'PENDING_CHANGE_CONFIRMATION',
        'CHANGE_ACCEPTED',
        'CHANGE_REJECTED',
        'REJECTED',
        'CANCELED'
    )
        NOT NULL DEFAULT 'PENDING',
    notes TEXT NULL,
    pickup_stop_id BIGINT NULL,
    pickup_address VARCHAR(255) NULL,
    pickup_reference TEXT NULL,
    pickup_latitude DECIMAL(10,8) NULL,
    pickup_longitude DECIMAL(11,8) NULL,
    dropoff_stop_id BIGINT NULL,
    dropoff_address VARCHAR(255) NULL,
    dropoff_reference TEXT NULL,
    dropoff_latitude DECIMAL(10,8) NULL,
    dropoff_longitude DECIMAL(11,8) NULL,
    estimated_extra_route_minutes DECIMAL(6,2) NULL,
    estimated_boarding_minutes INT NOT NULL DEFAULT 3,
    accepted_at TIMESTAMP NULL,
    confirmation_required_at TIMESTAMP NULL,
    confirmed_change_at TIMESTAMP NULL,
    rejected_change_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ride_requests_ride
        FOREIGN KEY (ride_id)
        REFERENCES rides(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ride_requests_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ride_requests_driver
        FOREIGN KEY (driver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT uk_ride_requests_ride_requester
        UNIQUE (ride_id, requester_id),
    CONSTRAINT chk_ride_requests_not_self
        CHECK (requester_id <> driver_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-BACK-006 | NOTIFICATIONS
-- ============================================================================
-- Avisos persistentes com acoes para alteracoes/cancelamentos de caronas.
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ride_id BIGINT NULL,
    type ENUM(
        'ride_updated',
        'ride_cancelled',
        'ride_request_created',
        'ride_request_accepted',
        'ride_request_rejected',
        'passenger_rejected_update',
        'passenger_accepted_update'
    ) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read', 'resolved') NOT NULL DEFAULT 'unread',
    action_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_ride
        FOREIGN KEY (ride_id)
        REFERENCES rides(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-RIDE-003 | RIDE STOPS
-- ============================================================================
-- Paradas intermediarias fazem parte da rota e exigem reconfirmacao.
CREATE TABLE ride_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    ride_request_id BIGINT NULL,
    passenger_id BIGINT NULL,
    stop_type ENUM('pickup', 'dropoff') NOT NULL,
    stop_order INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    estimated_stop_minutes INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ride_stops_ride
        FOREIGN KEY (ride_id)
        REFERENCES rides(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ride_stops_passenger
        FOREIGN KEY (passenger_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_ride_stops_request
        FOREIGN KEY (ride_request_id)
        REFERENCES ride_requests(id)
        ON DELETE CASCADE,
    CONSTRAINT uk_ride_stops_order
        UNIQUE (ride_id, stop_order),
    CONSTRAINT chk_ride_stops_stop_time
        CHECK (estimated_stop_minutes BETWEEN 0 AND 3)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

ALTER TABLE ride_requests
    -- HP-DB-004 | As FKs de pickup/dropoff sao adicionadas depois porque
    -- ride_requests e ride_stops se referenciam entre si.
    ADD CONSTRAINT fk_ride_requests_pickup_stop
        FOREIGN KEY (pickup_stop_id)
        REFERENCES ride_stops(id)
        ON DELETE SET NULL;

ALTER TABLE ride_requests
    ADD CONSTRAINT fk_ride_requests_dropoff_stop
        FOREIGN KEY (dropoff_stop_id)
        REFERENCES ride_stops(id)
        ON DELETE SET NULL;

-- ============================================================================
-- HP-CHAT-001 | RIDE MESSAGES
-- ============================================================================
-- Historico real do chat entre motorista e passageiro aprovado na carona.
CREATE TABLE ride_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ride_messages_ride
        FOREIGN KEY (ride_id)
        REFERENCES rides(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ride_messages_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ride_messages_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- HP-DB-005 | INDICES
-- ============================================================================
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_vehicle ON rides(vehicle_id);
CREATE INDEX idx_rides_origin ON rides(origin);
CREATE INDEX idx_rides_destination ON rides(destination);
CREATE INDEX idx_rides_departure ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);

CREATE INDEX idx_requests_ride ON ride_requests(ride_id);
CREATE INDEX idx_requests_requester ON ride_requests(requester_id);
CREATE INDEX idx_requests_driver ON ride_requests(driver_id);
CREATE INDEX idx_requests_status ON ride_requests(status);
CREATE INDEX idx_requests_pickup_stop ON ride_requests(pickup_stop_id);
CREATE INDEX idx_requests_dropoff_stop ON ride_requests(dropoff_stop_id);

CREATE INDEX idx_messages_ride_created ON ride_messages(ride_id, created_at);
CREATE INDEX idx_messages_sender ON ride_messages(sender_id);
CREATE INDEX idx_messages_receiver ON ride_messages(receiver_id);

CREATE INDEX idx_notifications_user_status
    ON notifications(user_id, status, created_at);
CREATE INDEX idx_notifications_ride ON notifications(ride_id);
CREATE INDEX idx_ride_stops_ride_order ON ride_stops(ride_id, stop_order);
CREATE INDEX idx_ride_stops_passenger ON ride_stops(passenger_id);
CREATE INDEX idx_ride_stops_request ON ride_stops(ride_request_id);
