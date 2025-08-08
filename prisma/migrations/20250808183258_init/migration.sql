-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hashedPassword" TEXT,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastSeen" DATETIME,
    "email" TEXT,
    "faxNumber" TEXT,
    "licenseNumber" TEXT,
    "deaNumber" TEXT,
    "npiNumber" TEXT,
    "ncpdpNumber" TEXT,
    "ownerName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Gateway" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gatewayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastSeen" DATETIME,
    "pharmacyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Gateway_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sensorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastReadingTemperature" REAL,
    "lastReadingHumidity" REAL,
    "lastReadingTimestamp" DATETIME,
    "gatewayId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sensor_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPharmacy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "pharmacyId" INTEGER NOT NULL,
    CONSTRAINT "UserPharmacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPharmacy_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_code_key" ON "Pharmacy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Gateway_gatewayId_key" ON "Gateway"("gatewayId");

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_sensorId_key" ON "Sensor"("sensorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPharmacy_userId_pharmacyId_key" ON "UserPharmacy"("userId", "pharmacyId");
