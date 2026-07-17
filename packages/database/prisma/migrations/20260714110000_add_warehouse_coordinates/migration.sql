ALTER TABLE "Warehouse"
ADD COLUMN "address" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

UPDATE "Warehouse"
SET
  "address" = 'Seoul, South Korea',
  "latitude" = 37.5665,
  "longitude" = 126.9780
WHERE "code" = 'SEL-01';

UPDATE "Warehouse"
SET
  "address" = 'Busan, South Korea',
  "latitude" = 35.1796,
  "longitude" = 129.0756
WHERE "code" = 'BUS-01';
