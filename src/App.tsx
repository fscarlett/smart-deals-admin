import { Show } from '@clerk/react'

function App() {
  return (
    <>
      {/* <h3>IQ Smart Deals Admin</h3> */}
      <Show when='signed-out'>
        <p>Please sign in to access the admin panel.</p>
      </Show>
      <Show when='signed-in'>
        <p>Dashboard with deals stats</p>
      </Show>
    </>
  )
}

export default App
