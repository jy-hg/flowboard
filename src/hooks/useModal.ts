import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Marks everything outside the modal as inert so keyboard focus and assistive
// tech can't reach the page behind it. Returns a function that undoes it.
function inertSiblings(modal: HTMLElement) {
  const changed: HTMLElement[] = [];
  let node: HTMLElement | null = modal;
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true;
        changed.push(sibling);
      }
    }
    node = parent;
  }
  return () => changed.forEach((element) => (element.inert = false));
}

export function useModal<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  // Captured during the first render, before the modal's autoFocus moves focus.
  const triggerRef = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    const trigger = triggerRef.current;
    const restoreInert = ref.current ? inertSiblings(ref.current) : undefined;
    return () => {
      restoreInert?.();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !ref.current) return;
      const focusable = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return ref;
}
