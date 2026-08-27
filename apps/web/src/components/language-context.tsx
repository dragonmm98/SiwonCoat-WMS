"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type Language = "EN" | "KR";

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: "EN", setLanguage: () => undefined });

const KO: Record<string, string> = {
  "Warehouse Overview": "창고 개요",
  "Real-time inventory and operations": "실시간 재고 및 운영 현황",
  "Search SKU, batch or order": "SKU, 배치 또는 주문 검색",
  "Warehouse Admin": "창고 관리자",
  Administrator: "관리자",
  Overview: "개요",
  Inventory: "재고",
  Inbound: "입고",
  Outbound: "출고",
  Tasks: "작업",
  Production: "생산",
  Locations: "위치",
  Reports: "보고서",
  Settings: "설정",
  "All rights reserved.": "모든 권리 보유.",
  "Total Stock": "총 재고",
  "Low Stock": "재고 부족",
  "Inbound Today": "오늘 입고",
  "Outbound Today": "오늘 출고",
  units: "개",
  items: "품목",
  "vs yesterday": "어제 대비",
  "Reorder soon": "곧 재주문 필요",
  Across: "총",
  receipts: "건 입고",
  shipments: "건 출고",
  "Inventory by Product": "제품별 재고",
  Units: "수량",
  Weight: "중량",
  "Warehouse Capacity": "창고 용량",
  Used: "사용 중",
  "Zone A": "A 구역",
  "Zone B": "B 구역",
  "Raw Materials": "원자재",
  "Total Capacity": "총 용량",
  "Recent Inventory Activity": "최근 재고 활동",
  Time: "시간",
  Type: "유형",
  Item: "품목",
  "Batch / Order": "배치 / 주문",
  Quantity: "수량",
  Location: "위치",
  Status: "상태",
  Received: "입고 완료",
  Dispatched: "출고 완료",
  Completed: "완료",
  "View all activity": "모든 활동 보기",
  "Attention Required": "확인 필요",
  "below reorder point": "재주문 기준 미만",
  "inspection due": "검사 예정",
  capacity: "용량",
  "View all alerts": "모든 알림 보기",
  "Today's Operations": "오늘의 운영",
  "Material received": "자재 입고",
  "Quality inspection": "품질 검사",
  "Production transfer": "생산 이송",
  "Carrier pickup": "운송사 픽업",
  "Inventory control": "재고 관리",
  "Search balances by SKU, barcode, lot, or physical location.": "SKU, 바코드, 로트 또는 실제 위치로 재고를 검색합니다.",
  "New adjustment": "새 재고 조정",
  "On-hand units": "보유 수량",
  Available: "사용 가능",
  Reserved: "예약됨",
  Quarantined: "격리됨",
  balance: "재고 건",
  balances: "재고 건",
  usable: "사용 가능",
  "Allocated to orders": "주문에 할당됨",
  "Unavailable stock": "사용 불가 재고",
  "Inventory balances": "재고 잔액",
  "Updated just now": "방금 업데이트됨",
  "Seoul Fulfillment Center": "서울 물류 센터",
  SKU: "SKU",
  Product: "제품",
  "Location / lot": "위치 / 로트",
  "No lot": "로트 없음",
  "on hand": "보유",
  reserved: "예약",
  Search: "검색",
  Filter: "필터",
  Showing: "표시 중",
  records: "건",
  "Inbound operations": "입고 운영",
  "Receiving & putaway": "입고 및 적치",
  "Track purchase orders from dock arrival through storage.": "도크 도착부터 보관까지 구매 주문을 추적합니다.",
  "Open scanner": "스캐너 열기",
  "New purchase order": "새 구매 주문",
  "Expected units": "예정 수량",
  "Received units": "입고 수량",
  "Open orders": "진행 중 주문",
  "Completed orders": "완료된 주문",
  "purchase order": "구매 주문",
  "purchase orders": "구매 주문",
  "No receipts yet": "아직 입고 없음",
  complete: "완료",
  "units remaining": "개 남음",
  "Received or closed": "입고 또는 마감",
  "Expected receipts": "입고 예정",
  "Purchase order": "구매 주문",
  Supplier: "공급업체",
  Expected: "예정",
  "Dock / owner": "도크 / 담당자",
  "No purchase orders have been created yet.": "아직 생성된 구매 주문이 없습니다.",
  "Outbound operations": "출고 운영",
  "Orders & fulfillment": "주문 및 출고 처리",
  "Track sales orders from allocation through shipment.": "할당부터 배송까지 판매 주문을 추적합니다.",
  "New sales order": "새 판매 주문",
  "Ordered units": "주문 수량",
  "Allocated units": "할당 수량",
  "Ready to ship": "배송 준비",
  "Shipped orders": "배송된 주문",
  "Sales orders": "판매 주문",
  Customer: "고객",
  Ordered: "주문됨",
  "Allocation / owner": "할당 / 담당자",
  "Work orchestration": "작업 관리",
  "Warehouse tasks": "창고 작업",
  "Prioritize and assign work across receiving and fulfillment.": "입고 및 출고 작업의 우선순위를 정하고 배정합니다.",
  "Create task": "작업 생성",
  "Open tasks": "진행 작업",
  "In progress": "진행 중",
  Exceptions: "예외",
  "Task queue": "작업 대기열",
  Task: "작업",
  Workflow: "워크플로",
  "Route / reference": "경로 / 참조",
  Assignee: "담당자",
  Assigned: "배정됨",
  "Master data": "마스터 데이터",
  "Product catalog": "제품 카탈로그",
  "Manage SKUs, barcode aliases, dimensions, and tracking rules.": "SKU, 바코드 별칭, 규격 및 추적 규칙을 관리합니다.",
  "Import products": "제품 가져오기",
  "New SKU": "새 SKU",
  "Active SKUs": "활성 SKU",
  "With barcodes": "바코드 있음",
  "Lot tracked": "로트 추적",
  "Missing barcode": "바코드 없음",
  Products: "제품",
  Barcode: "바코드",
  Tracking: "추적",
  Active: "활성",
  "Production & Batches": "생산 및 배치",
  "Manage coating production, materials and quality control": "코팅 생산, 자재 및 품질 관리를 관리합니다",
  "Active Batches": "활성 배치",
  "Planned Today": "오늘 계획",
  "Completed Today": "오늘 완료",
  "QC Pending": "품질 검사 대기",
  All: "전체",
  Planned: "계획됨",
  "New Batch": "새 배치",
  "Search by batch number": "배치 번호 검색",
  Date: "날짜",
  "Production Progress": "생산 진행률",
  Mixing: "혼합",
  Dispersion: "분산",
  Filling: "충전",
  Finished: "완료",
  "Raw Material Consumption": "원자재 사용량",
  Material: "자재",
  QC: "품질 검사",
  "QC Status": "품질 검사 상태",
  Checked: "확인됨",
  Pending: "대기 중",
  Actions: "작업",
  "View Details": "상세 보기",
  "Record QC": "품질 검사 기록",
  "Complete Batch": "배치 완료",
  "Production Schedule": "생산 일정",
  "Start Time": "시작 시간",
  "Batch Number": "배치 번호",
  "Planned Quantity": "계획 수량",
  Line: "라인",
  Administration: "관리",
  "Manage fulfillment centers and configure operational defaults.": "물류 센터와 운영 기본 설정을 관리합니다.",
  "Add warehouse": "창고 추가",
  Warehouses: "창고",
  Selected: "선택됨",
  Zones: "구역",
  "Configured storage points": "설정된 보관 지점",
  "Across all warehouses": "모든 창고 합계",
  "View all on map": "지도에서 모두 보기",
  "Current warehouse": "현재 창고",
  "Switch to warehouse": "창고 전환",
  "Operational settings": "운영 설정",
  "Users & permissions": "사용자 및 권한",
  "Allocation rules": "할당 규칙",
  "Labels & printing": "라벨 및 인쇄",
  Integrations: "연동",
  "Storage locations": "보관 위치",
  "Manage warehouse zones, aisles, racks, bins, and capacity.": "창고 구역, 통로, 랙, 빈 및 용량을 관리합니다.",
  "Add location": "위치 추가",
  Zone: "구역",
  Aisle: "통로",
  Rack: "랙",
  Bin: "빈",
  Notifications: "알림",
  Save: "저장",
  Cancel: "취소",
  Back: "뒤로",
  Edit: "편집",
  Delete: "삭제",
  Name: "이름",
  Code: "코드",
  Description: "설명",
  Notes: "메모",
  Create: "생성",
  Update: "업데이트",
};

function translate(value: string) {
  let result = value;
  for (const [english, korean] of Object.entries(KO).sort(([a], [b]) => b.length - a.length)) {
    result = result.split(english).join(korean);
  }
  return result;
}

function LanguageTranslator({ language }: { language: Language }) {
  const originalsRef = useRef(new WeakMap<Text, string>());
  const attributeOriginalsRef = useRef(new WeakMap<Element, Map<string, string>>());
  useEffect(() => {
    const originals = originalsRef.current;
    const attributeOriginals = attributeOriginalsRef.current;
    const attributes = ["placeholder", "aria-label", "title"];
    let observer: MutationObserver;

    const process = (root: Node, refreshOriginal = false) => {
      const texts: Text[] = [];
      if (root.nodeType === Node.TEXT_NODE) texts.push(root as Text);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) texts.push(walker.currentNode as Text);
      for (const node of texts) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue;
        if (refreshOriginal || !originals.has(node)) originals.set(node, node.data);
        const original = originals.get(node) ?? node.data;
        const next = language === "KR" ? translate(original) : original;
        if (node.data !== next) node.data = next;
      }
      const elements = root.nodeType === Node.ELEMENT_NODE
        ? [root as Element, ...(root as Element).querySelectorAll("*")]
        : [];
      for (const element of elements) {
        let saved = attributeOriginals.get(element);
        if (!saved) { saved = new Map(); attributeOriginals.set(element, saved); }
        for (const attribute of attributes) {
          const current = element.getAttribute(attribute);
          if (current === null) continue;
          if (refreshOriginal || !saved.has(attribute)) saved.set(attribute, current);
          const original = saved.get(attribute) ?? current;
          const next = language === "KR" ? translate(original) : original;
          if (current !== next) element.setAttribute(attribute, next);
        }
      }
    };

    const observe = () => observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
    });
    observer = new MutationObserver((mutations) => {
      observer.disconnect();
      for (const mutation of mutations) {
        if (mutation.type === "childList") mutation.addedNodes.forEach((node) => process(node, true));
        else if (mutation.type === "characterData") process(mutation.target, true);
      }
      observe();
    });
    process(document.body);
    document.documentElement.lang = language === "KR" ? "ko" : "en";
    observe();
    return () => observer.disconnect();
  }, [language]);
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("EN");
  useEffect(() => {
    const saved = localStorage.getItem("siwon-language");
    if (saved === "KR") setLanguageState("KR");
  }, []);
  const setLanguage = (next: Language) => {
    setLanguageState(next);
    localStorage.setItem("siwon-language", next);
  };
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
      <LanguageTranslator language={language} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
