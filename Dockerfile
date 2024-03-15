# Use the official Node.js Alpine image
FROM node:alpine

# Set the working directory in the container
WORKDIR /usr/src/app/server

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the remaining project files to the working directory
COPY . .

# Expose port 8000
EXPOSE 8000

# Start the application
CMD ["npm", "run", "start"]
