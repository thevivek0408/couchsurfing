
Here’s a complete guide to **installing** the Couchsurfing in your local pc and **redeploying** an already deployed website.

---

## **🚀 Installing Couchers.org on a New PC**
### **1. Install Prerequisites**
Before setting up the project, install:


- **Git** → [Download Git](https://git-scm.com/downloads)
- **Node.js (v20.x)** → [Download Node.js](https://nodejs.org/)
- **Yarn** → Install via npm:
  ```sh
  npm install -g yarn
  ```
- **Docker & Docker Compose** → [Install Docker](https://docs.docker.com/engine/install/)

### **2. Clone the Repository**
```sh
git clone https://github.com/thevivek0408/couchsurfing.git
cd couchsurfing/app
```

### **3. Compile Protocol Buffers**
For **macOS/Linux/WSL2**:
```sh
docker run --pull always --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```
For **Windows (without WSL2)**:
```sh
docker run --pull always --rm -w /app -v %cd%:/app registry.gitlab.com/couchers/grpc sh -c "cat generate_protos.sh | dos2unix | sh"
```

### **4. Start the Backend**
```sh
docker-compose up --build
```

### **5. Install & Start the Frontend**
```sh
cd web
yarn install
yarn dev
```
Once running, open **http://localhost:3000/** in your browser.

---

## **🔄 Redeploying an Already Deployed Website**
### **1. Pull the Latest Code**
```sh
git pull origin main
```

### **2. Rebuild & Restart Backend**
```sh
docker-compose down
docker-compose up --build
```

### **3. Reinstall & Restart Frontend**
```sh
cd web
yarn install
yarn dev
```

### **4. Verify Deployment**
- Check logs for errors:
  ```sh
  docker-compose logs
  ```
- Open **http://localhost:3000/** to confirm the site is running.

---

///------>>


If you've closed everything—Docker, the backend, and the frontend—you can reopen them with these steps:

### **1. Start Docker & Backend**
Navigate to your **project directory** (`app`) and run:
```sh
docker-compose up --build
```
This will restart your backend services.

### **2. Start the Frontend**
Open a **new terminal** and navigate to `app/web`, then run:
```sh
yarn dev
```

### **3. Check If the Website Is Running**
Once everything starts:
- **Local URL:** [http://localhost:3000](http://localhost:3000)
- **Network URL:** Your IP (e.g., `http://192.168.29.63:3000`)
