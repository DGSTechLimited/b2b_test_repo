FROM node:20-bookworm
 
WORKDIR /app
 
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
 
# 1) Copy package files
COPY package.json package-lock.json* ./
 
# 2) Copy prisma folder BEFORE npm install (so postinstall works)
COPY prisma ./prisma
 
# 3) Now install deps (postinstall can find schema)
RUN npm install
 
# 4) Copy the rest of the app
COPY . .
 
EXPOSE 3000
CMD ["npm", "run", "dev"]