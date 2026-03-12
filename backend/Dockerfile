FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

RUN sed -i 's/\r$//' mvnw \
    && chmod +x mvnw

RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:25-jre AS runtime

WORKDIR /app

COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
