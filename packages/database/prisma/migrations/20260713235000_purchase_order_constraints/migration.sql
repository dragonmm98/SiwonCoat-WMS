ALTER TABLE "PurchaseOrder"
  ADD CONSTRAINT "PurchaseOrder_valid_priority" CHECK ("priority" BETWEEN 0 AND 3);

ALTER TABLE "PurchaseOrderLine"
  ADD CONSTRAINT "PurchaseOrderLine_positive_expected" CHECK ("expectedQty" > 0),
  ADD CONSTRAINT "PurchaseOrderLine_valid_received" CHECK ("receivedQty" >= 0 AND "receivedQty" <= "expectedQty");
