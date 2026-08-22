import { useRegisterSW } from 'virtual:pwa-register/react'
import { HomePage } from '../pages/HomePage'

function App() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  return (
    <>
      <HomePage />
      {needRefresh[0] && (
        <button
          className="fixed right-4 bottom-4 rounded-full bg-[#173d2a] px-5 py-3 text-sm font-semibold text-white shadow-lg"
          type="button"
          onClick={() => void updateServiceWorker(true)}
        >
          Обновить приложение
        </button>
      )}
    </>
  )
}

export default App
