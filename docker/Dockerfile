FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql mysqli \
    && a2enmod headers

EXPOSE 80
