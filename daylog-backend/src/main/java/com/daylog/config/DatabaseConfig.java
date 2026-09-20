//package com.daylog.config;
//
//import com.zaxxer.hikari.HikariDataSource;
//import java.net.URI;
//import java.net.URISyntaxException;
//import org.springframework.boot.jdbc.DataSourceBuilder;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.core.env.Environment;
//
//@Configuration
//public class DatabaseConfig {
//    private final Environment environment;
//
//    public DatabaseConfig(Environment environment) {
//        this.environment = environment;
//    }
//
//    @Bean
//    public HikariDataSource dataSource() {
//        String configuredUrl = property("spring.datasource.url", "DATABASE_URL", "");
//        String url = configuredUrl;
//        if (url.isBlank()) {
//            url = "jdbc:postgresql://localhost:5432/daylog";
//        } else if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
//            url = normalizePostgresUrl(url);
//        }
//
//        HikariDataSource dataSource = DataSourceBuilder.create()
//            .type(HikariDataSource.class)
//            .url(url)
//            .build();
//        String databaseUsername = property("spring.datasource.username", "DATABASE_USERNAME", "");
//        String databasePassword = property("spring.datasource.password", "DATABASE_PASSWORD", "");
//        if ((databaseUsername.isBlank() || databasePassword.isBlank())
//            && (configuredUrl.startsWith("postgres://") || configuredUrl.startsWith("postgresql://"))) {
//            String[] credentials = credentialsFromUrl(configuredUrl);
//            if (databaseUsername.isBlank()) {
//                databaseUsername = credentials[0];
//            }
//            if (databasePassword.isBlank()) {
//                databasePassword = credentials[1];
//            }
//        }
//        if (databaseUsername != null && !databaseUsername.isBlank()) {
//            dataSource.setUsername(databaseUsername);
//        }
//        if (databasePassword != null && !databasePassword.isBlank()) {
//            dataSource.setPassword(databasePassword);
//        }
//        return dataSource;
//    }
//
//    private String property(String primaryKey, String fallbackKey, String defaultValue) {
//        String primary = environment.getProperty(primaryKey);
//        if (primary != null && !primary.isBlank()) {
//            return primary.trim();
//        }
//        String fallback = environment.getProperty(fallbackKey);
//        return fallback == null ? defaultValue : fallback.trim();
//    }
//
//    private String[] credentialsFromUrl(String rawUrl) {
//        try {
//            URI uri = new URI(rawUrl.replaceFirst("^postgres://", "postgresql://"));
//            String userInfo = uri.getRawUserInfo();
//            if (userInfo == null || userInfo.isBlank()) {
//                return new String[]{"", ""};
//            }
//            String[] parts = userInfo.split(":", 2);
//            String username = java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8);
//            String password = parts.length > 1
//                ? java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8)
//                : "";
//            return new String[]{username, password};
//        } catch (URISyntaxException exception) {
//            throw new IllegalStateException("DATABASE_URL is not a valid PostgreSQL URL", exception);
//        }
//    }
//
//    private String normalizePostgresUrl(String rawUrl) {
//        try {
//            URI uri = new URI(rawUrl.replaceFirst("^postgres://", "postgresql://"));
//            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
//            if (uri.getPort() > 0) {
//                jdbcUrl.append(':').append(uri.getPort());
//            }
//            jdbcUrl.append(uri.getRawPath() == null ? "" : uri.getRawPath());
//            if (uri.getRawQuery() != null) {
//                jdbcUrl.append('?').append(uri.getRawQuery());
//            }
//            return jdbcUrl.toString();
//        } catch (URISyntaxException exception) {
//            throw new IllegalStateException("DATABASE_URL is not a valid PostgreSQL URL", exception);
//        }
//    }
//}