/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `SessionToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ipAddr` to the `SessionToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionToken" ADD COLUMN     "ipAddr" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SessionToken_userId_key" ON "SessionToken"("userId");
