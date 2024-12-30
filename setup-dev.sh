#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up development environment...${NC}"

# Frontend setup
echo -e "${GREEN}Setting up frontend...${NC}"
cd game
cp .env.development .env.local
npm install
cd ..

# Backend setup
echo -e "${GREEN}Setting up backend...${NC}"
cd bot
cp .env.development .env
npm install
cd ..

echo -e "${BLUE}Setup complete! To start development:${NC}"
echo -e "1. Start backend: ${GREEN}cd bot && npm run dev${NC}"
echo -e "2. Start frontend: ${GREEN}cd game && npm run dev${NC}" 