import { Map } from "ol";

export const debounce = (func: (map: Map, svg: Uint8Array) => void, wait: number) => {
  let timeout: number;
  return (map: Map, svg: Uint8Array) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(map, svg), wait);
  };
}
