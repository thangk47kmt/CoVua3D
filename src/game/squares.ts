export function squareCenter(square: string, flipped: boolean): [number, number, number] {
  let file = square.charCodeAt(0) - 97;
  let rank = Number(square[1]) - 1;
  if (flipped) {
    file = 7 - file;
    rank = 7 - rank;
  }
  return [file - 3.5, 0, 3.5 - rank];
}

export function pointToSquare(x: number, z: number, flipped: boolean): string | null {
  const file = Math.floor(x + 4);
  const rank = Math.floor(4 - z);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  const logicalFile = flipped ? 7 - file : file;
  const logicalRank = flipped ? 7 - rank : rank;
  return `${String.fromCharCode(97 + logicalFile)}${logicalRank + 1}`;
}
