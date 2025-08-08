import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sensors = await prisma.sensor.findMany({
    include: { pharmacy: true },
  });
  console.log("All sensors:");
  sensors.forEach(sensor => {
    console.log(`- Sensor: ${sensor.sensorRef || sensor.sensorId} | Name: ${sensor.name} | Location: ${sensor.location} | Pharmacy: ${sensor.pharmacy?.name || "N/A"}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
