-- Создание базы данных
CREATE DATABASE IF NOT EXISTS test1;
USE test1;

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_identifier CHECK (
        identifier REGEXP '^[0-9]{10,}$' OR 
        identifier REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы файлов
CREATE TABLE IF NOT EXISTS files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    extension VARCHAR(50),
    mime_type VARCHAR(100),
    size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы токенов
CREATE TABLE IF NOT EXISTS tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Индексы для оптимизации запросов
CREATE INDEX idx_user_identifier ON users(identifier);
CREATE INDEX idx_user_files ON files(user_id);
CREATE INDEX idx_user_tokens ON tokens(user_id);
CREATE INDEX idx_token_valid ON tokens(is_valid);
CREATE INDEX idx_refresh_token ON tokens(refresh_token);

-- Добавление тестового пользователя (пароль: test123)
-- INSERT INTO users (identifier, password_hash) VALUES 
-- ('test@example.com', '$2b$10$6jM7G7XyYkZ7HQMX3vR1EOLn.Yf8/dqsXe4UOmzx.mx4vd.ACvJPi');
