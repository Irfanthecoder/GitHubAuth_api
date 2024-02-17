show databases;
-- create database github;
use github;
show tables;
-- drop table users;

create table users
(id int auto_increment PRIMARY KEY, user_name VARCHAR(255), email VARCHAR(255),
password VARCHAR(255), name VARCHAR(255),
otp VARCHAR(255) DEFAULT NULL,
is_active BOOLEAN DEFAULT 1,
created_at datetime DEFAULT CURRENT_TIMESTAMP,
updated_at datetime ON UPDATE CURRENT_TIMESTAMP);

-- insert into users (user_name, email, password, name) values('Irfanthecoder', 'example@email.com', 'As12345', 'Irfan Shaikh');
