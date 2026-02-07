# FiTime - Studio Management Platform

*The all-in-one management platform for fitness and pilates studios.*

FiTime is a comprehensive, full-stack web application designed to streamline the daily operations of fitness studios. It provides administrators with powerful tools for managing schedules, users, and resources, while offering a seamless experience for trainers and members.


---

### 🚀 Live Demo

**The application is live and running at: [fitime.co.il](https://fitime.co.il)**

---


## ✨ Key Features

-   **👑 Multi-Tenancy Architecture:** Supports multiple studios within a single system. Each studio's data (members, trainers, rooms, schedule) is completely isolated.

-   **👥 Comprehensive User Management:**
    -   **Multi-Role System:** Clearly defined roles (`Owner`, `Admin`, `Trainer`, `Member`) with specific permissions.
    -   **Owner Dashboard:** A global view for the system owner to manage all studios, create new ones, and assign administrators.
    -   **Admin Dashboard:** A studio-specific control panel for managing members, trainers, rooms, and studio settings.
    -   **Role Switching:** Users with multiple roles (e.g., a trainer in one studio and a member in another) can easily switch between views.

-   **🗓️ Dynamic Scheduling & Booking:**
    -   Built with **FullCalendar** for an interactive and intuitive scheduling experience.
    -   Create, update, and delete classes (meetings).
    -   View schedule by month, week, or day.
    -   Automatic filtering of available trainers and rooms based on date and time to prevent scheduling conflicts.

-   **🎟️ Smart Waiting List:**
    -   When a class is full, members can join a waiting list.
    -   If a spot opens up, the first person in line is automatically notified and has a chance to book.
    -   If they decline or their time expires, the next person on the list is notified, ensuring classes are always full.

-   **📊 Studio Analytics & Overview:**
    -   The admin dashboard provides at-a-glance statistics, including the number of active members, classes scheduled for the day, and new members this month.

-   **⚙️ Resource & Settings Management:**
    -   Manage studio rooms, including capacity and equipment availability.
    -   Configure studio details and set weekly operating hours.

-   **🔐 Secure Authentication:**
    -   Uses **JSON Web Tokens (JWT)** for secure, session-based authentication.
    -   Passwords are encrypted using a salted hash for enhanced security.

---

## 🛠️ Technology Stack

### Frontend
-   **React.js:** A robust JavaScript library for building user interfaces.
-   **React Router:** For declarative, client-side routing.
-   **FullCalendar:** For the interactive scheduling component.
-   **Axios:** For making promise-based HTTP requests to the backend API.
-   **CSS3:** Custom styling for a clean and responsive design.

### Backend
-   **Node.js:** A JavaScript runtime for building the server-side application.
-   **Express.js:** A minimal and flexible Node.js web application framework.
-   **MySQL:** The relational database used to store all application data.
-   **JWT (jsonwebtoken):** For implementing secure user authentication.
-   **CORS:** To handle Cross-Origin Resource Sharing.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18.x or later)
-   NPM (v9.x or later)
-   A running MySQL server

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/ZionAmar/FiTime.git](https://github.com/ZionAmar/FiTime.git)
    cd FiTime
    ```

2.  **Install backend dependencies:**
    ```sh
    cd server
    npm install
    ```

3.  **Install frontend dependencies:**
    ```sh
    cd ../client
    npm install
    ```

4.  **Set up the database:**
    -   Create a new MySQL database (e.g., `fitime`).
    -   Import the `fitime.sql` file provided in the repository to set up all the tables and initial data.

5.  **Configure Environment Variables:**
    -   In the `server` directory, create a file named `.env`.
    -   Use the structure below and fill in your details.

    ```env
    # Database Configuration
    HOST=localhost
    USER_DB=root
    PASSWORD=
    DATABASE=fitime

    # Server Configuration
    PORT=4060

    # JWT Configuration
    jwtSecret=your_super_secret_jwt_key
    salt=your_secret_salt_for_passwords

    # Optional: for high traffic / many users (defaults: 25 connections, queue 50)
    # DB_POOL_SIZE=25
    # DB_QUEUE_LIMIT=50
    ```

    **Optional — Performance indexes:** For installations with many users and meetings, run `performance_indexes.sql` once on your database to add indexes that speed up schedule and list queries. If you get "Duplicate key name" errors, the indexes already exist.

6.  **Run the application:**
    -   **Start the backend server:** In the `server` directory, run:
      ```sh
      npm start
      ```
    -   **Start the frontend development server:** In a new terminal, navigate to the `client` directory and run:
      ```sh
      npm start
      ```

The application should now be running at `http://localhost:3000`.

---

## 📧 Contact

Zion Amar - [amzion24@gmail.com](mailto:amzion24@gmail.com)

Project Link: [https://github.com/ZionAmar/FiTime](https://github.com/ZionAmar/FiTime)