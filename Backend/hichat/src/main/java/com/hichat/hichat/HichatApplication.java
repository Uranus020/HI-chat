package com.hichat.hichat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication
public class HichatApplication {

	public static void main(String[] args) {
		SpringApplication.run(HichatApplication.class, args);
	}

}
