import { useState } from 'react';

export function useQuickAction() {
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (name) => setActiveModal(name);
  const closeModal = () => setActiveModal(null);
  return { activeModal, openModal, closeModal };
}
