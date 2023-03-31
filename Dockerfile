# ---------------------------------------------------------------------------- #
#                        Prisma issue on binary targets                        #
# ---------------------------------------------------------------------------- #

FROM node:lts As development

RUN apt-get update
RUN apt-get install openssl

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm build

FROM node:lts As production

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