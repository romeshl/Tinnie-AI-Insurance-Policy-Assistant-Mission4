## Stage 1: Build the SvelteKit project
# FROM node:18 AS builder

# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build

# # Stage 2: Serve the built project
# FROM node:18
# WORKDIR /app
# COPY --from=builder /app/build ./build
# RUN npm install -g serve
# CMD ["serve", "-s", "build", "-l", "5000"]

FROM node:alpine as build

ADD . /app
WORKDIR /app

RUN npm install
RUN npm run build

FROM nginx:stable
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html