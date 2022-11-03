# ---------------------------------------------------------------------------- #
#                        Prisma issue on binary targets                        #
# ---------------------------------------------------------------------------- #

FROM node:alpine As development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm build

FROM node:alpine As production

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

COPY . .
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main.js"]