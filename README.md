# Playground - Professional API Testing Tool

A modern, full-featured API testing platform built with React and FastAPI. Test APIs, analyze rate limits, and explore OpenAPI specifications - all in one sleek interface.

## Features

###  API Request Testing
- **Multiple HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Custom Headers**: Add, enable/disable, and manage headers with ease
- **Authentication Support**: Bearer token authentication
- **Request Body**: JSON formatting with syntax highlighting
- **Response Inspection**: View status codes, headers, response bodies, and timing
- **Request History**: Track your recent API calls
- **Save & Organize**: Save frequently used requests for quick access

###  Rate Limit Testing
- **Load Testing**: Send multiple requests per second to test rate limits
- **Configurable Duration**: Test from 1-60 seconds
- **Detailed Analytics**: 
  - Total requests sent
  - Successful requests
  - Rate-limited responses (429s)
  - Other errors
  - First rate limit occurrence
  - Estimated safe RPS (Requests Per Second)
- **Custom Headers & Auth**: Full support for authenticated rate limit testing

### OpenAPI Integration
- **Spec Discovery**: Load OpenAPI/Swagger specifications from any URL
- **Endpoint Browser**: Browse all available endpoints with search and filtering
- **Auto-generated Examples**: Automatic example generation from schemas
- **One-Click Testing**: Load any endpoint directly into the request builder
- **Parameter Display**: View all query, path, and header parameters
- **Schema Support**: Full OpenAPI 3.0 and Swagger 2.0 support
- **Persistent Storage**: Your loaded specs survive page refreshes

### User Management
- **Secure Authentication**: JWT-based authentication
- **User Registration**: Create accounts with email validation
- **Password Requirements**: Minimum 8 characters
- **Session Management**: Automatic token storage and validation

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Session Storage** - Client-side persistence

### Backend
- **FastAPI** - Python web framework
- **SQLModel** - Database ORM
- **JWT** - Authentication
- **HTTPX** - Async HTTP client
- **SQLite** - Database

## Installation
##  Docker Quick Start (Recommended)

The easiest way to get Playground running is using Docker. This automatically handles database migrations, environment setup, and service orchestration.
**Clone the repository**
```bash
git clone https://github.com/yourusername/playground.git
cd playground/
```
### 1. Prerequisites
- **Docker** and **Docker Compose** installed on your machine.
- **Node.js 20+** (if running natively).

### 2. Launch the Application
From the root directory, run:
```bash
docker-compose up --build
```
### 3. Visit site
Frontend will be available at  `http://localhost:5173`
##  Manual Setup(Optional)
### Prerequisites
- Node.js 20+ and npm/yarn
- Python 3.12+
- SQLite for development

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/playground.git
cd playground/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```


4. **Run database migrations**
```bash
alembic upgrade head
```
4.1 **Making migrations**
When adding new models, generate migrations like so:
```bash
alembic -c App/alembic.ini revision --autogenerate -m "your_description"
```

5. **Start the backend server**
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### Making API Requests

1. **Select HTTP Method**: Choose GET, POST, PUT, PATCH, or DELETE
2. **Enter URL**: Type or paste your API endpoint
3. **Add Headers** (optional): Click "Add Header" to include custom headers
4. **Add Authentication** (optional): Switch to the Auth tab and select Bearer Token
5. **Add Request Body** (optional): Switch to the Body tab and enter JSON
6. **Send Request**: Click "Send Request"
7. **View Response**: See status code, timing, headers, and response body

### Rate Limit Testing

1. Navigate to the **Rate Limit Test** tab
2. Configure your request (method, URL, headers, auth, body)
3. Set **Requests Per Second** (1-1000)
4. Set **Duration** (1-60 seconds)
5. Click **Run Rate Limit Test**
6. Analyze the results to find your API's rate limits

### OpenAPI Integration

1. Navigate to the **OpenAPI Docs** tab
2. Enter your OpenAPI spec URL (e.g., `http://localhost:8000/openapi.json`)
3. Click **Load Spec**
4. Browse endpoints using the search bar or scrolling
5. Click an endpoint to expand and view details
6. Click **Try This Endpoint** to load it into the request builder
7. Use **Refresh** to reload the spec when your API changes
8. Use **Clear** to load a different API

### Saving Requests

1. After configuring a request, click the **Bookmark** icon
2. Optionally give it a custom name
3. Click **Save**
4. Access saved requests from the **Saved Requests** section
5. Click **Play** to load a saved request
6. Click **Trash** to delete a saved request

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **Rate Limiting**: Per-user rate limits on API requests
- **CORS Configuration**: Configurable CORS for production
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection
## Troubleshooting
Database issues? If tables aren't appearing, ensure you are referencing the absolute path /app/App/database.db inside Docker. To reset the database volume:
```bash
docker-compose down -v
docker-compose up --build
```
Port Conflicts? Ensure ports 5173 and 8000 are free on your host machine before running.
## UI Features

- **Dark Theme**: Modern dark UI optimized for long sessions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live request/response timing
- **Syntax Highlighting**: JSON formatting and highlighting
- **Loading States**: Clear loading indicators for all async operations
- **Error Handling**: Friendly error messages and validation

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
## Known Issues

- Rate limit testing with very high RPS (>500) may be throttled by client browser
- OpenAPI specs with circular `$ref` references may not display examples correctly
- Large response bodies (>10MB) may cause UI lag

