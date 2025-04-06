To run this application you first need to have Docker installed on your system.
> [!NOTE]
> 1. Start Docker Engine
> 2. Clone the repository

```bash
git clone https://github.com/KoteshwarChinnolla/Collab-Code-Platform/tree/deployment
```
> 3. Run Docker Compose

```bash
docker compose up --build
```


## overview

The Dockeriseing include creating a docker image for FrontEnd application and a Docker image for backEnd application. To run the entire application we individually need to run Each frontEnd and BackEnd containers separately. Instead of this we can create a compose file providing all the requirements to run both the applications together. So here we just need to run the docker compose file and your application will be up and running. Now how this two containers connect ? we introduce Networking. we make both the containers use the same network so that they can communicate with each other. 

### creating Docker image for frontEnd application

```bash
docker build -t frontend ./frontend
```

### creating Docker image for backEnd application

```bash 
docker build -t backend ./backend
```

### Networking

Creating networking is impotent because we need to have a suppurate bridge network in our case code_p for our containers so that they can communicate so effectively.

To create a network we use the following command

```bash
docker network create code_p
```

### Running Docker containers

**Running frontend container**
> !!!
> require a frontend env file
> running on port 3000

```bash
docker run --name=frontend --network=code_p --env-file .env -d -p 3000:3000 frontend
```
**Running backend container**
> !!!
> require a backend env file
> running on port 5000

```bash
docker run --name=backend --network=code_p --env-file .env -d -p 5000:5000 backend
```

### Running docker compose

Typing the following commands every time for both the containers will be very tiring so we can create a compose file to run both the containers together.

```bash
docker compose up -d
```