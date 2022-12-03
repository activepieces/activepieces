package com.activepieces;

import com.activepieces.common.CascadeDeleteHandler;
import com.activepieces.guardian.server.ResourcePublisher;
import com.activepieces.instance.client.InstancePublisher;
import com.github.cloudyrock.spring.v5.EnableMongock;
import com.google.common.collect.ImmutableList;
import lombok.extern.log4j.Log4j;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ValidatorFactory;
import java.io.IOException;
import java.time.Duration;

@SpringBootApplication(scanBasePackages = "com.activepieces")
@EnableJpaRepositories(basePackages = "com.activepieces")
@EntityScan(basePackages = "com.activepieces")
@EnableMongoRepositories(
    basePackages = "com.activepieces")
@EnableMongock
@EnableScheduling
@EnableAsync
@Log4j2
public class BackendApplication implements CommandLineRunner {

  private final JdbcTemplate jdbcTemplate;

  @Autowired
  public BackendApplication(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public static void main(String[] args) {
    SpringApplication.run(BackendApplication.class, args);
  }

  @Override
  public void run(String... strings) {

  }

  @Bean
  public PasswordEncoder encoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public InstancePublisher instancePublisher() {
    return new InstancePublisher();
  }

  @Bean
  public ResourcePublisher resourcePublisher(CascadeDeleteHandler cascadeDeleteHandler) {
    return new ResourcePublisher(ImmutableList.of(cascadeDeleteHandler));
  }

  @Bean
  public Validator validator() {
    ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    return factory.getValidator();
  }
}
