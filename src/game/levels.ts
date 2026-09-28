export type Level = {
  id: number;
  name: string;
  blurb: string;
  movetime: number;
  noise: number;
  depthCap: number;
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Ánh sao",
    blurb: "Hay đi sai, hợp để làm quen quân và nước chiếu.",
    movetime: 60,
    noise: 0.82,
    depthCap: 1,
  },
  {
    id: 2,
    name: "Vệ tinh",
    blurb: "Biết bắt quân và tránh những chiếu hết quá lộ.",
    movetime: 180,
    noise: 0.38,
    depthCap: 2,
  },
  {
    id: 3,
    name: "Chòm sao",
    blurb: "Tính trước vài nước, chơi chắc ở thế cờ thường.",
    movetime: 480,
    noise: 0.08,
    depthCap: 3,
  },
  {
    id: 4,
    name: "Tinh vân",
    blurb: "Tìm sâu hơn, ít thí quân và biết nhập thành.",
    movetime: 1100,
    noise: 0,
    depthCap: 4,
  },
  {
    id: 5,
    name: "Thiên thể",
    blurb: "Mạnh nhất bàn cờ này — phòng thủ vững, tính dài.",
    movetime: 2200,
    noise: 0,
    depthCap: 5,
  },
];

export function levelById(id: number): Level {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[2];
}
