# 🎵 Spotify Clone — Full-Stack Music Streaming App

A full-stack music streaming web application inspired by Spotify. Built with **Node.js / Express** on the backend and **React (Vite)** on the frontend, with **MongoDB** as the database and **ImageKit** for cloud media storage.

---

## 🚀 Features

- 🔐 **Authentication** — Register, login, logout with JWT cookies & bcrypt password hashing
- 🎵 **Songs** — Browse, play, create, update, and delete songs (artists only)
- 💿 **Albums** — Browse and create albums (artists only)
- ❤️ **Liked Songs** — Toggle like/unlike on songs
- 📋 **Playlists** — Create playlists and add songs to them
- ☁️ **File Uploads** — Upload audio & cover images via ImageKit CDN
- 🛡️ **Role-Based Access** — `listener` and `artist` roles with protected routes

---

## 🛠️ Tech Stack

### Backend
| Technology     | Purpose                        |
|----------------|-------------------------------|
| Node.js        | Runtime environment            |
| Express.js v5  | HTTP server / API framework    |
| MongoDB        | NoSQL database                 |
| Mongoose       | ODM for MongoDB                |
| JWT            | Authentication tokens          |
| bcryptjs       | Password hashing               |
| Multer         | Multipart file handling        |
| ImageKit       | Cloud media storage & CDN      |
| cookie-parser  | HTTP cookie support            |
| dotenv         | Environment variable management|
| CORS           | Cross-origin resource sharing  |

### Frontend
| Technology       | Purpose                      |
|------------------|------------------------------|
| React 19         | UI library                   |
| Vite             | Build tool & dev server      |
| React Router DOM | Client-side routing          |
| Zustand          | State management             |
| Axios            | HTTP client                  |
| Tailwind CSS     | Utility-first styling         |
| Lucide React     | Icon library                 |
| react-hot-toast  | Toast notifications          |
| react-dropzone   | Drag-and-drop file uploads   |

---

## 📁 Project Structure

```
Backend/
├── server.js              # Entry point — connects DB, starts Express server
├── src/
│   ├── app.js             # Express app setup (middleware + routes)
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── songController.js
│   │   ├── albumController.js
│   │   ├── uploadController.js
│   │   └── userActionsController.js
│   ├── middlewares/
│   │   └── authMiddleware.js   # JWT protect + role-based authorize
│   ├── models/
│   │   ├── User.js
│   │   ├── Song.js
│   │   ├── Album.js
│   │   └── Playlist.js
│   └── routes/
│       ├── authRoutes.js
│       ├── songRoutes.js
│       ├── albumRoutes.js
│       ├── uploadRoutes.js
│       └── userActionRoutes.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── pages/
        ├── components/
        ├── store/
        └── lib/
```

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Endpoint         | Access    | Description          |
|--------|------------------|-----------|----------------------|
| POST   | `/register`      | Public    | Create new account   |
| POST   | `/login`         | Public    | Login & set cookie   |
| POST   | `/logout`        | Public    | Clear auth cookie    |
| GET    | `/check`         | Protected | Verify current user  |

### Songs — `/api/songs`
| Method | Endpoint   | Access          | Description        |
|--------|------------|-----------------|--------------------|
| GET    | `/`        | Public          | Get all songs      |
| GET    | `/:id`     | Public          | Get single song    |
| POST   | `/`        | Artist only     | Create a song      |
| PUT    | `/:id`     | Artist only     | Update a song      |
| DELETE | `/:id`     | Artist only     | Delete a song      |

### Albums — `/api/albums`
| Method | Endpoint | Access      | Description       |
|--------|----------|-------------|-------------------|
| GET    | `/`      | Public      | Get all albums    |
| GET    | `/:id`   | Public      | Get single album  |
| POST   | `/`      | Artist only | Create an album   |

### User Actions — `/api/my`
| Method | Endpoint                   | Access    | Description               |
|--------|----------------------------|-----------|---------------------------|
| GET    | `/playlists`               | Protected | Get user's playlists      |
| POST   | `/playlists`               | Protected | Create a playlist         |
| PUT    | `/playlists/:id/add`       | Protected | Add song to playlist      |
| POST   | `/liked/:songId`           | Protected | Toggle like on a song     |

### Upload — `/api/upload`
| Method | Endpoint | Access      | Description                        |
|--------|----------|-------------|------------------------------------|
| GET    | `/auth`  | Artist only | Get ImageKit auth params           |
| POST   | `/`      | Artist only | Upload file (audio / cover image)  |

---

## ⚙️ Environment Variables

Create a `.env` file in the **root** directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file in the **frontend/** directory:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- ImageKit account

### 1. Clone the repository
```bash
git clone https://github.com/Kadiwalhussain/backend.git
cd backend
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Set up environment variables
Copy the `.env` examples above and fill in your values.

### 5. Run the backend (development)
```bash
npm run dev
```
Server starts at `http://localhost:3000`

### 6. Run the frontend (development)
```bash
cd frontend
npm run dev
```
Frontend starts at `http://localhost:5173`

---

## 👤 User Roles

| Role       | Permissions                                                  |
|------------|--------------------------------------------------------------|
| `listener` | Browse songs/albums, like songs, create & manage playlists   |
| `artist`   | All listener permissions + create/update/delete songs & albums, upload media |

---

## 🔒 Authentication Flow

1. User registers or logs in → JWT is issued and stored in an **HTTP-only cookie**
2. Protected routes use the `protect` middleware to verify the JWT
3. Role-restricted routes additionally use the `authorize('artist')` middleware

---

## 📦 Scripts

### Backend
| Command       | Description                      |
|---------------|----------------------------------|
| `npm start`   | Start production server          |
| `npm run dev` | Start dev server with hot-reload |

### Frontend
| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start Vite dev server    |
| `npm run build` | Build for production     |
| `npm run lint`  | Run ESLint               |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

> Made with ❤️ by [Kadiwalhussain](https://github.com/Kadiwalhussain)
