# 서비스 5개 공통 Dockerfile. spring-build.yml이 빌드한 실행 jar 하나(app.jar)를 넣는다.
# 빌드(Gradle)는 워크플로에서 하고, 이미지는 JRE만 담는다.
FROM eclipse-temurin:21-jre-noble

# 컨테이너 메모리 상한의 75%를 힙으로 쓴다. 나머지는 스레드·메타스페이스용(gitops README 7장)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError" \
    TZ=Asia/Seoul

WORKDIR /app
COPY app.jar /app/app.jar

# root가 아닌 사용자로 돈다(차트의 runAsNonRoot). 숫자 UID여야 쿠버네티스가 확인할 수 있다
USER 10001:10001

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
