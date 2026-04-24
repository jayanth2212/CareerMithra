import { useContext } from "react";
import { CareerMithraContext } from "./CareerMithraContext";

export function useCareerMithra() {
  const context = useContext(CareerMithraContext);
  if (!context) {
    throw new Error("useCareerMithra must be used inside CareerMithraProvider");
  }

  return context;
}
