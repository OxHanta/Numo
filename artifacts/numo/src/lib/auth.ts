import { useEffect } from "react";
import { useClerk } from "@clerk/react";

export function getReturnTo() {
  return window.location.pathname + window.location.search;
}
