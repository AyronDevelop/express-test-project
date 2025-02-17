# REST API для управления файлами

REST API сервис для управления файлами с JWT-авторизацией.

## Технологии

- Node.js
- Express.js
- MySQL
- JWT для авторизации
- Multer для загрузки файлов

## Установка и запуск

1. Клонируйте репозиторий
```bash
git clone <repository-url>
```

2. Установите зависимости
```bash
npm install
```

3. Создайте файл .env в корне проекта со следующими параметрами:
```env
PORT=3000
HOST=localhost

DB_HOST=localhost
DB_USER=test_usr
DB_PASSWORD=AFUde1NLLCHG8dfB
DB_NAME=test

JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-super-refresh-secret-key-here
JWT_EXPIRES_IN=10m
JWT_REFRESH_EXPIRES_IN=7d

MAX_FILE_SIZE=100000000
UPLOAD_PATH=uploads
```

4. Если у вас установлен Docker, вы можете запустить MySQL сервер, используя Docker Compose. Это также создаст базу данных и пользователя, используя файл `database.sql`:
```bash
docker-compose up -d
```

MySQL сервер будет доступен по адресу `localhost:3306`.

Дополнительные команды для управления MySQL в Docker:

- Просмотр логов: `docker-compose logs mysql`
- Остановка: `docker-compose down`
- Удаление данных: `docker-compose down -v`

5. Запустите сервер:
```bash
npm run dev
```

## API Документация

### Аутентификация

#### Регистрация нового пользователя
- **URL**: `/signup`
- **Метод**: `POST`
- **Тело запроса**:
```json
{
    "id": "user@example.com",
    "password": "password123"
}
```
- **Успешный ответ**:
```json
{
    "message": "Пользователь успешно зарегистрирован",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
}
```
- **Примечание**: `id` может быть email или телефоном (минимум 10 цифр)

#### Вход в систему
- **URL**: `/signin`
- **Метод**: `POST`
- **Тело запроса**:
```json
{
    "id": "user@example.com",
    "password": "password123"
}
```
- **Успешный ответ**:
```json
{
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
}
```

#### Обновление токена
- **URL**: `/signin/new_token`
- **Метод**: `POST`
- **Тело запроса**:
```json
{
    "refreshToken": "eyJhbG..."
}
```
- **Успешный ответ**:
```json
{
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
}
```

#### Получение информации о пользователе
- **URL**: `/info`
- **Метод**: `GET`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Успешный ответ**:
```json
{
    "id": "user@example.com"
}
```

#### Выход из системы
- **URL**: `/logout`
- **Метод**: `GET`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Успешный ответ**:
```json
{
    "message": "Успешный выход из системы"
}
```

### Работа с файлами

#### Загрузка файла
- **URL**: `/file/upload`
- **Метод**: `POST`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
  - Content-Type: multipart/form-data
- **Параметры формы**:
  - file: Файл для загрузки (максимальный размер 100MB)
- **Успешный ответ**:
```json
{
    "message": "Файл успешно загружен",
    "fileId": 1,
    "filename": "example.pdf",
    "size": 1024,
    "mimeType": "application/pdf"
}
```

#### Получение списка файлов
- **URL**: `/file/list`
- **Метод**: `GET`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Параметры запроса**:
  - list_size: Количество файлов на странице (по умолчанию 10)
  - page: Номер страницы (по умолчанию 1)
- **Успешный ответ**:
```json
{
    "files": [
        {
            "id": 1,
            "name": "example.pdf",
            "extension": ".pdf",
            "mime_type": "application/pdf",
            "size": 1024,
            "upload_date": "2024-02-17T10:30:00Z"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 50,
        "itemsPerPage": 10
    }
}
```

#### Получение информации о файле
- **URL**: `/file/:id`
- **Метод**: `GET`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Успешный ответ**:
```json
{
    "id": 1,
    "name": "example.pdf",
    "extension": ".pdf",
    "mime_type": "application/pdf",
    "size": 1024,
    "upload_date": "2024-02-17T10:30:00Z"
}
```

#### Скачивание файла
- **URL**: `/file/download/:id`
- **Метод**: `GET`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Ответ**: Файл для скачивания

#### Обновление файла
- **URL**: `/file/update/:id`
- **Метод**: `PUT`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
  - Content-Type: multipart/form-data
- **Параметры формы**:
  - file: Новый файл
- **Успешный ответ**:
```json
{
    "message": "Файл успешно обновлен",
    "filename": "example.pdf",
    "size": 1024,
    "mimeType": "application/pdf"
}
```

#### Удаление файла
- **URL**: `/file/delete/:id`
- **Метод**: `DELETE`
- **Заголовки**: 
  - Authorization: Bearer {accessToken}
- **Успешный ответ**:
```json
{
    "message": "Файл успешно удален"
}
```

## Особенности реализации

1. **JWT Авторизация**:
   - Access token действителен 10 минут
   - Refresh token действителен 7 дней
   - При выходе из системы все refresh токены пользователя инвалидируются
   - Поддержка множественных сессий (вход с разных устройств)

2. **Валидация**:
   - Проверка формата email/телефона
   - Минимальная длина пароля - 6 символов
   - Проверка размера файла (максимум 100MB)
   - Проверка владельца файла при операциях с файлами

3. **Безопасность**:
   - Хеширование паролей с помощью bcrypt
   - Защита от SQL-инъекций
   - CORS настроен для доступа с любого домена
   - Валидация всех входных данных

4. **Файловая система**:
   - Уникальные имена файлов
   - Сохранение метаданных в БД
   - Автоматическое определение MIME-типа
   - Поддержка пагинации при получении списка файлов
