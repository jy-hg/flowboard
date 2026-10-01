import { useEffect, useRef, useState } from 'react';

// Two-step confirmation without time limits. Focus moves to the cancel button
// when confirmation is requested (the safe default) and returns to the trigger
// when it is dismissed.
export function useConfirm(onConfirm: () => void) {
  const [isConfirming, setIsConfirming] = useState(false);
  const triggerElement = useRef<HTMLButtonElement | null>(null);
  const cancelElement = useRef<HTMLButtonElement | null>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (isConfirming) cancelElement.current?.focus();
    else if (wasConfirming.current) triggerElement.current?.focus();
    wasConfirming.current = isConfirming;
  }, [isConfirming]);

  function triggerRef(element: HTMLButtonElement | null) {
    triggerElement.current = element;
  }

  function cancelRef(element: HTMLButtonElement | null) {
    cancelElement.current = element;
  }

  function request() {
    setIsConfirming(true);
  }

  function confirm() {
    setIsConfirming(false);
    onConfirm();
  }

  function cancel() {
    setIsConfirming(false);
  }

  return { isConfirming, request, confirm, cancel, triggerRef, cancelRef };
}
