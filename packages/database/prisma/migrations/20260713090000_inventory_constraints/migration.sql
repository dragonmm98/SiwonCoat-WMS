-- Location labels must resolve unambiguously across the entire installation.
DROP INDEX "Location_zoneId_barcode_key";
CREATE UNIQUE INDEX "Location_barcode_key" ON "Location"("barcode");

-- Core inventory invariants are enforced in PostgreSQL as well as application code.
ALTER TABLE "InventoryBalance"
  ADD CONSTRAINT "InventoryBalance_nonnegative_on_hand" CHECK ("onHandQty" >= 0),
  ADD CONSTRAINT "InventoryBalance_valid_reserved" CHECK ("reservedQty" >= 0 AND "reservedQty" <= "onHandQty");

ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_positive_quantity" CHECK ("quantity" > 0);

ALTER TABLE "SalesOrderLine"
  ADD CONSTRAINT "SalesOrderLine_positive_ordered" CHECK ("orderedQty" > 0),
  ADD CONSTRAINT "SalesOrderLine_valid_allocated" CHECK ("allocatedQty" >= 0 AND "allocatedQty" <= "orderedQty"),
  ADD CONSTRAINT "SalesOrderLine_valid_picked" CHECK ("pickedQty" >= 0 AND "pickedQty" <= "allocatedQty");
