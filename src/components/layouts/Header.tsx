import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function Header() {
  return (
    <header className='p-4 bg-gray-800 '>
      <div className='container max-w-7xl mx-auto flex justify-between items-center'>
        <div>
          <h1 className='text-lg'>iQ Smart Deals Admin</h1>
        </div>
        <div>
          <Show when='signed-out'>
            <SignInButton />
            {/* <SignUpButton /> */}
          </Show>
          <Show when='signed-in'>
            <div className='flex items-center space-x-4'>
              <div>main nav</div>
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}
export default Header
