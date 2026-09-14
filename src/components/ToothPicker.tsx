import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { QUADRANT_1, QUADRANT_2, QUADRANT_3, QUADRANT_4 } from "../data/teeth";
import { ChevronDown } from "lucide-react";

interface ToothPickerProps {
  value: string; // numéro de dent en string ("" si aucune sélection), pour rester compatible avec ActeRow
  onChange: (numeroDent: string) => void;
}

const VIEWPORT_MARGIN = 8;

// Petit bouton "dent" — carré arrondi avec le numéro, pas un vrai schéma
// anatomique (comme le grand Odontogram), pour rester lisible en miniature.
function ToothChip({
  numero,
  isSelected,
  onClick,
}: {
  numero: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[10.5px] font-semibold transition-colors ${
        isSelected
          ? "border-primary bg-primary text-white"
          : "border-border bg-white text-text-muted hover:border-primary hover:bg-primary-light hover:text-primary-dark"
      }`}
    >
      {numero}
    </button>
  );
}

export function ToothPicker({ value, onChange }: ToothPickerProps) {
  const [open, setOpen] = useState(false);
  // null tant que la position finale n'a pas été calculée -> évite un flash
  // à la mauvaise place avant que la largeur réelle soit mesurée.
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calcule la position en fonction de la largeur RÉELLE de la popover
  // (mesurée après rendu), pas d'une largeur supposée à l'avance.
  // C'est ce qui évite qu'elle déborde à gauche dans la sidebar.
  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    if (!containerRef.current || !popoverRef.current) return;

    const updatePosition = () => {
      const buttonRect = containerRef.current!.getBoundingClientRect();
      const popoverWidth = popoverRef.current!.offsetWidth;

      let left = buttonRect.left;
      const maxLeft = window.innerWidth - popoverWidth - VIEWPORT_MARGIN;
      if (left > maxLeft) left = maxLeft;
      if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

      setCoords({
        top: buttonRect.bottom + 4,
        left,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // Ferme le popover au clic en dehors (bouton OU popover, vu qu'il est
  // rendu dans un portal ailleurs dans le DOM).
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = containerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedButton && !clickedPopover) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (numero: number) => {
    onChange(String(numero));
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-1.5 rounded-lg border-[1.5px] border-border bg-white px-2.5 py-2 text-[13px] outline-none transition-colors focus:border-primary ${
          value ? "text-text" : "text-text-subtle"
        }`}
      >
        {value || "Dent…"}
        <ChevronDown size={13} strokeWidth={2.2} className="text-text-subtle" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden", // évite le flash tant que non positionné
            }}
            className="z-50 inline-block max-w-[calc(100vw-16px)] rounded-xl border border-border bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-2 text-center text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">
              Arcade supérieure
            </div>
            <div className="mb-3 flex items-center justify-center gap-2.5">
              <div className="flex gap-1">
                {QUADRANT_1.map((n) => (
                  <ToothChip key={n} numero={n} isSelected={value === String(n)} onClick={() => handleSelect(n)} />
                ))}
              </div>
              <div className="w-px self-stretch bg-border" />
              <div className="flex gap-1">
                {QUADRANT_2.map((n) => (
                  <ToothChip key={n} numero={n} isSelected={value === String(n)} onClick={() => handleSelect(n)} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border-soft" />

            <div className="my-2 text-center text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">
              Arcade inférieure
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <div className="flex gap-1">
                {QUADRANT_4.map((n) => (
                  <ToothChip key={n} numero={n} isSelected={value === String(n)} onClick={() => handleSelect(n)} />
                ))}
              </div>
              <div className="w-px self-stretch bg-border" />
              <div className="flex gap-1">
                {QUADRANT_3.map((n) => (
                  <ToothChip key={n} numero={n} isSelected={value === String(n)} onClick={() => handleSelect(n)} />
                ))}
              </div>
            </div>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-3 w-full rounded-lg border border-border py-1.5 text-[11.5px] font-medium text-text-muted transition-colors hover:bg-surface"
              >
                Effacer la sélection
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}