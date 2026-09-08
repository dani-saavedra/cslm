FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /build
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
# Warm the dependency cache in its own layer so source-only changes rebuild fast.
RUN ./gradlew --no-daemon --quiet dependencies || true
COPY src ./src
RUN ./gradlew --no-daemon --quiet clean bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S cslm && adduser -S cslm -G cslm
COPY --from=build /build/build/libs/cslm-backend-*.jar app.jar
USER cslm
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
