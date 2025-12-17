-- CreateTable
CREATE TABLE "DeskAvailableDate" (
    "id" TEXT NOT NULL,
    "deskId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeskAvailableDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeskAvailableDate_deskId_date_key" ON "DeskAvailableDate"("deskId", "date");

-- AddForeignKey
ALTER TABLE "DeskAvailableDate" ADD CONSTRAINT "DeskAvailableDate_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
