# AgentInfra Control Plane — Spring Boot

Spring Boot implementation of the AgentInfra control plane, created for learning purposes.

This project mirrors the functionality of `apps/control-plane` (NestJS) using the Java/Spring ecosystem.

## Tech Stack

- **Java 17** + **Spring Boot 3.3**
- **MyBatis-Plus 3.5** + **PostgreSQL**
- **Lombok** for boilerplate reduction
- **Maven** for build

## Quick Start

```bash
# Make sure Postgres is running (via docker-compose)
docker compose -f ../../deploy/docker-compose.yml up -d postgres

# Run the application (port 3002)
./mvnw spring-boot:run
```

## Project Structure

```
src/main/java/com/agentinfra/controlplane/
├── ControlPlaneApplication.java   # Entry point
├── entity/                        # (TODO) Agent, AgentVersion, Run 实体类
├── mapper/                        # (TODO) BaseMapper 接口
├── service/                       # (TODO) Service + ServiceImpl
├── controller/                    # (TODO) REST 接口
├── dto/                           # (TODO) 请求/响应 DTO
└── config/                        # (TODO) MyBatis-Plus 等配置
```

## NestJS → Spring Boot Mapping

| NestJS Concept       | Spring Boot Equivalent        |
|----------------------|-------------------------------|
| Module               | @Configuration / @ComponentScan |
| Controller           | @RestController               |
| Service (Injectable) | @Service                      |
| Prisma ORM           | MyBatis-Plus (BaseMapper + LambdaQuery) |
| Zod validation       | Jakarta Bean Validation       |
| ConfigService        | @Value / @ConfigurationProperties |
| Guard / Pipe         | Filter / Interceptor          |
