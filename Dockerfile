
FROM node:20-alpine

# Install system dependencies required for the agent and network tools
# procps: provides 'ps' used in nezha.ts check
# util-linux: provides 'setsid' used in nezha.ts
# bash: shell for execution
RUN apk add --no-cache bash procps util-linux

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Environment variables can be overridden at runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "run", "start"]
