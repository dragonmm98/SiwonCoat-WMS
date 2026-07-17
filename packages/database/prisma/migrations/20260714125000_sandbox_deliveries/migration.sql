-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DeliveryShipment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SANDBOX',
    "service" TEXT NOT NULL DEFAULT 'STANDARD',
    "trackingNumber" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'CREATED',
    "estimatedDeliveryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryEvent" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryShipment_trackingNumber_key" ON "DeliveryShipment"("trackingNumber");
CREATE INDEX "DeliveryShipment_orderId_idx" ON "DeliveryShipment"("orderId");
CREATE INDEX "DeliveryShipment_status_createdAt_idx" ON "DeliveryShipment"("status", "createdAt");
CREATE INDEX "DeliveryEvent_shipmentId_occurredAt_idx" ON "DeliveryEvent"("shipmentId", "occurredAt");

-- AddForeignKey
ALTER TABLE "DeliveryShipment" ADD CONSTRAINT "DeliveryShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "DeliveryShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
