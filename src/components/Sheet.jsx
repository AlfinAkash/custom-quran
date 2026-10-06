import * as Dialog from '@radix-ui/react-dialog'

export function Sheet({ onClose, children }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fade-in fixed inset-x-0 bottom-0 z-40 mx-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/40 bg-night p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6">
          <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-gold/40 sm:hidden" /><Dialog.Title className="sr-only">Panel</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
