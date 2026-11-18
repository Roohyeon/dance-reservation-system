// DB 표 모양 (supabase/schema.sql 의 dance_rooms · dance_reservations 와 같게)

export type RoomType = "dance" | "band" | "vocal";

export type Room = {
  id: number;
  name: string;
  type: RoomType;
  size_m2: number;
  capacity: number;
  features: string;
  image_url: string | null;
};

// 브라우저에서 읽을 수 있는 예약 칸만 (이름 · 전화번호 · 비밀번호는 못 읽음)
export type Booking = {
  start_hour: number;
  hours: number;
};

export type ReservationSummary = {
  id: number;
  room_id: number;
  date: string; // "2026-11-18"
  start_hour: number;
  hours: number;
  people: number;
  created_at: string;
  rooms: Pick<Room, "name" | "type">;
};

// dance_find_my_reservations 함수가 돌려주는 모양
export type MyReservation = {
  id: number;
  room_name: string;
  date: string;
  start_hour: number;
  hours: number;
  people: number;
  guest_name: string;
  total_price: number;
};

// ---- 댄스 클래스 (supabase/schema-classes.sql 의 dance_classes · dance_class_applications 와 같게) ----

export type DanceGenre = "hiphop" | "girls_hiphop" | "waacking" | "locking" | "popping" | "kpop";
export type Experience = "none" | "under1" | "over1";

export type DanceClass = {
  id: number;
  genre: DanceGenre;
  title: string;
  level: string;
  days: string; // "화 · 목"
  start_time: string; // "19:00"
  end_time: string;
  room_name: string;
  sessions_per_month: number;
  price: number;
  capacity: number;
  description: string;
};

// 신청 완료 화면 (이름 · 전화번호는 DB 에서 막아 둬서 못 읽어요)
export type ApplicationSummary = {
  id: number;
  class_id: number;
  created_at: string;
  dance_classes: DanceClass;
};

// dance_find_my_applications 함수가 돌려주는 모양
export type MyApplication = {
  id: number;
  class_id: number;
  genre: DanceGenre;
  title: string;
  level: string;
  days: string;
  start_time: string;
  end_time: string;
  room_name: string;
  price: number;
  name: string;
  created_at: string;
};
