# NestJS Blogging Project

This is a RESTful blogging API built with NestJS and PostgreSQL. The application allows users to create, manage, and publish blogs with functionality for authentication, authorization, and blog management, including pagination, filtering, and search.

---

## Features

- User registration and login with JWT-based authentication (1-hour expiration)
- CRUD operations for blogs with support for draft and published states
- Blog listing for all users, including pagination, filtering, and sorting
- Individual blog retrieval, which increments the blog's read count
- Blog attributes include `title`, `description`, `tags`, `author`, `timestamp`, `state`, `read_count`, `reading_time`, and `body`
- Searchable by author, title, and tags
- Pagination and ordering options for blogs by `read_count`, `reading_time`, and `timestamp`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview) (optional but recommended)
- [PostgreSQL](https://www.postgresql.org/) database

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/busayo-OD/nestjs-blogging-app.git
   cd nestjs-blogging-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the environment variables** (see [Environment Variables](#environment-variables))

4. **Run database migrations** (if using TypeORM or a migration tool)

   ```bash
   npm run migration:run
   ```

5. **Start the application**

   ```bash
   npm run start:dev
   ```

---

## Environment Variables

Create a `.env` file at the root of the project and define the following variables:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=yourusername
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=yourdatabase
JWT_SECRET=yourjwtsecret
JWT_EXPIRATION_TIME_IN_SEC=yourtimeinseconds
```

---

## Usage

Once the application is running, you can access the API through `http://localhost:3000`.

### Running Tests

To run the tests:

```bash
npm run test
```

---

## API Endpoints

### Authentication

- **POST /auth/register** - Register a new user
- **POST /auth/login** - Log in to receive a JWT token

### Blog Management

- **GET /blogs** - Retrieve a list of published blogs (paginated, searchable, and sortable)
- **GET /blogs/:id** - Retrieve a single published blog (increases `read_count` by 1)
- **POST /blogs** - Create a new blog (requires authentication)
- **PATCH /blogs/:id** - Edit an existing blog (requires blog ownership)
- **PATCH /blogs/:id/state** - Update blog state to `published` (requires blog ownership)
- **DELETE /blogs/:id** - Delete an existing blog (requires blog ownership)

### User Blogs

- **GET /users/:userId/blogs** - Retrieve a list of blogs by a user (paginated, filterable by state)

---

## Database Schema

### User

| Field       | Type       | Description                   |
|-------------|------------|-------------------------------|
| id          | UUID       | Primary key                   |
| first_name  | String     | User's first name             |
| last_name   | String     | User's last name              |
| email       | String     | Unique user email            |
| password    | String     | Hashed password               |
| created_at  | Timestamp  | Account creation date         |

### Blog

| Field        | Type       | Description                           |
|--------------|------------|---------------------------------------|
| id           | UUID       | Primary key                           |
| title        | String     | Blog title                            |
| description  | String     | Short description of the blog         |
| tags         | Array      | List of tags                          |
| author_id    | UUID       | Reference to the user who created it  |
| timestamp    | Timestamp  | Creation or last update date          |
| state        | Enum       | Blog state (`draft` or `published`)   |
| read_count   | Integer    | Number of times blog was read         |
| reading_time | Integer    | Estimated reading time in minutes     |
| body         | Text       | Content of the blog                   |

---

## Notes

- JWT tokens expire after one hour. Users need to re-authenticate after expiration.
- The reading time is calculated based on the average reading speed of 200 words per minute.
- Blog lists support pagination, filtering, and sorting by `read_count`, `reading_time`, and `timestamp`.
- For more detailed documentation on each endpoint, refer to the [Swagger API docs]() 

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
