# Use the official Node.js image as the base image
FROM node:16

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Set the working directory in the container
WORKDIR /app

# Add Bun to the PATH environment variable
ENV PATH="/root/.bun/bin:$PATH"

# Copy the package.json and bun.lockb files to the working directory
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 9300
EXPOSE 9301

# Start the application
CMD ["bun", "run", "src/index.ts"]
