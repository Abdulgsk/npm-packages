Here’s a detailed `README.md` file for your **create-express-mongo-server** CLI project:

---

````markdown
# 🚀 create-express-mongo-server

A simple CLI tool to quickly scaffold a Node.js + Express.js backend with MongoDB integration, optional CORS support, and development with Nodemon.

---

## 📦 Features

- ⚙️ Auto-generated folder structure (`routes`, `controllers`, `db`)
- 🌱 MongoDB integration using Mongoose
- 🔐 Environment variable support via `.env`
- 🔄 Optional CORS setup
- 🔁 Optional Nodemon for live reload
- ✅ Pre-configured starter code (`server.js`, example route & controller)
- 🛠 Installs all necessary dependencies

---

## 🏁 Getting Started

### Step 1: Install the CLI globally

```bash
npm install -g create-express-mongo-server
````

### Step 2: Run the CLI

```bash
npx create-express-mongo-server
```

### You will be prompted for:

* Project name
* MongoDB URI
* Whether to enable CORS
* Whether to use Nodemon

The project will be created in a new directory with the name you specify.

---

## 📁 Project Structure

```
your-project-name/
├── controllers/
│   └── userController.js
├── db/
│   └── db.js
├── routes/
│   └── users.js
├── .env
├── package.json
└── server.js
```

---

## ⚙️ .env Configuration

The `.env` file contains the following variables:

```env
MONGO_URI=your-mongodb-uri
PORT=5000
```

---

## 🧩 Scripts

Available scripts in `package.json`:

| Script        | Description                                     |
| ------------- | ----------------------------------------------- |
| `npm start`   | Starts the server using Node                    |
| `npm run dev` | Starts the server using Nodemon *(if selected)* |

---

## 🧪 Sample API Route

Test route is available at:

```
GET /api/users
```

Sample response:

```json
[
  { "id": 1, "name": "John" },
  { "id": 2, "name": "Smith" }
]
```

---

## 📦 Dependencies

* `express` – Web framework
* `mongoose` – MongoDB ODM
* `dotenv` – Environment variable management
* `cors` *(optional)* – Cross-Origin Resource Sharing
* `nodemon` *(optional)* – Auto-restarting dev server

---

## 📌 Example Usage

```bash
# Step 1: Navigate into the project folder
cd your-project-name

# Step 2: Install dependencies (if not done already)
npm install

# Step 3: Start the server
npm run dev   # if nodemon enabled
# or
npm start     # if nodemon not enabled
```

---

## 🛑 Graceful Shutdown

The server and MongoDB connection will close properly on:

* `Ctrl + C` (SIGINT)
* MongoDB disconnection events
* Unhandled promise rejections

---

## 📜 License

MIT License © 2025

---

## 👨‍💻 Author

Built with ❤️ by [Abdul](https://github.com/Abdulgsk)

```

---
