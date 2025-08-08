-- CreateTable
CREATE TABLE "Hub" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "macAddress" TEXT,
    "pharmacyId" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" DATETIME,
    "firmwareVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hub_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sensor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensorPushId" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "hubId" TEXT,
    "minTemp" REAL NOT NULL DEFAULT 36.0,
    "maxTemp" REAL NOT NULL DEFAULT 46.4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sensor_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sensor_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sensor" ("createdAt", "id", "isActive", "location", "maxTemp", "minTemp", "name", "pharmacyId", "sensorPushId") SELECT "createdAt", "id", "isActive", "location", "maxTemp", "minTemp", "name", "pharmacyId", "sensorPushId" FROM "Sensor";
DROP TABLE "Sensor";
ALTER TABLE "new_Sensor" RENAME TO "Sensor";
CREATE UNIQUE INDEX "Sensor_sensorPushId_key" ON "Sensor"("sensorPushId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Hub_serialNumber_key" ON "Hub"("serialNumber");
