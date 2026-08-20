# Use the official Node.js 22.17.1 image
FROM 824039889403.dkr.ecr.ap-south-1.amazonaws.com/node-22.17.1-alpine:latest

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock for faster installs
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the project
COPY . ./

# Build the application
RUN yarn build

# Expose the port (replace with your application's port)
EXPOSE 7000

# Command to start the application
CMD ["yarn", "start"]